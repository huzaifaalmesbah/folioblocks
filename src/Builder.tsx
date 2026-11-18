import { useCallback, useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { designChanged, pickState, sourceDesign, STORAGE_KEY, useBuilder } from './store';
import { requestPersistence, watchOtherTabs } from './saveStatus';
import { SaveStatus } from './ui/SaveStatus';
import { UndoBar, type Undo } from './ui/UndoBar';
import { generateTheme } from './generator';
import { buildZip } from './zip/buildZip';
import { renderScreenshot } from './zip/screenshot';
import { fetchAssets } from './zip/assets';
import { buildBlueprint, playgroundUrl } from './playground/blueprint';
import { exportSettings, parseSettings } from './layout';
import { InfoStep } from './ui/InfoStep';
import { StyleStep } from './ui/StyleStep';
import { TemplateStep } from './ui/TemplateStep';
import { PagesStep } from './ui/PagesStep';
import { PublishStep } from './ui/PublishStep';
import { MoreMenu } from './ui/MoreMenu';
import { PublishGuide } from './ui/PublishGuide';
import { QuickPreview } from './preview/QuickPreview';
import { publishChecklist } from './checklist';
import { LangToggle } from './i18n/LangToggle';
import { tr } from './i18n/ui';

type View = 'preview' | 'code';

/** Five steps, one job each: pick a design, add your info, adjust the style, arrange pages, publish. */
const STEPS = [
  { key: 'template', label: 'Template' },
  { key: 'info', label: 'Your info' },
  { key: 'style', label: 'Style' },
  { key: 'pages', label: 'Pages' },
  { key: 'publish', label: 'Publish' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];
const isStep = (v: unknown): v is StepKey => STEPS.some((s) => s.key === v);

/** Where to start: `#/build?step=info` (from the home page's template gallery), the last step this tab was on, or the beginning. */
function initialStep(): StepKey {
  const fromHash = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('step');
  if (isStep(fromHash)) return fromHash;
  try {
    const saved = sessionStorage.getItem('folioblocks-step');
    if (isStep(saved)) return saved;
  } catch {
    // Storage blocked: start at the beginning.
  }
  return 'template';
}

export function Builder() {
  const info = useBuilder((s) => s.info);
  const language = useBuilder((s) => s.language);
  const style = useBuilder((s) => s.style);
  const preset = useBuilder((s) => s.preset);
  const header = useBuilder((s) => s.header);
  const footer = useBuilder((s) => s.footer);
  const pages = useBuilder((s) => s.pages);
  const reset = useBuilder((s) => s.reset);
  const savedLayouts = useBuilder((s) => s.savedLayouts);

  const state = useMemo(
    () => pickState({ info, language, style, preset, header, footer, pages }),
    [info, language, style, preset, header, footer, pages],
  );
  const { slug, files, assets } = useMemo(() => generateTheme(state), [state]);
  // The preview fills empty parts with sample content; the theme above leaves them out.
  const preview = useMemo(() => generateTheme(state, { samples: true }), [state]);
  const paths = [...Object.keys(files), ...assets.map((a) => a.path)].sort();

  const [step, setStepState] = useState<StepKey>(initialStep);
  const setStep = (next: StepKey) => {
    setStepState(next);
    try {
      sessionStorage.setItem('folioblocks-step', next);
    } catch {
      // Storage blocked: the step just isn't remembered.
    }
  };
  const [selected, setSelected] = useState('theme.json');
  const [view, setView] = useState<View>('preview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);
  const clearUndo = useCallback(() => setUndo(null), []);

  // A link to `#/build?step=…` while the builder is open moves to that step.
  useEffect(() => {
    const onHash = () => {
      const next = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('step');
      if (isStep(next)) setStepState(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Keep the draft safe: ask the browser to keep this site's storage, and notice edits made in another tab.
  useEffect(() => {
    requestPersistence();
    return watchOtherTabs(STORAGE_KEY);
  }, []);
  const checklist = useMemo(() => publishChecklist(state), [state]);
  const source = sourceDesign(state, savedLayouts);
  const changed = designChanged(state, savedLayouts);
  // On small screens the form and the preview take turns.
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function openInPlayground() {
    window.open(playgroundUrl(buildBlueprint(state, slug, files, assets)), '_blank', 'noopener');
  }

  /** Everything needed to continue on another computer: info, photos, design and saved layouts. */
  function exportDraft() {
    const json = exportSettings(state, useBuilder.getState().savedLayouts);
    saveAs(new Blob([json], { type: 'application/json' }), `${slug}-folioblocks.json`);
  }

  async function importDraft(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setNotice('');
    try {
      const parsed = parseSettings(await file.text());
      if (!confirm(tr('Load this draft? It replaces your info and design. Your saved designs are kept.'))) return;
      useBuilder.getState().importSettings(parsed.state, parsed.layouts);
      setNotice(tr('Loaded {file}.', { file: file.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function downloadBlueprint() {
    const json = JSON.stringify(buildBlueprint(state, slug, files, assets), null, 2);
    saveAs(new Blob([json], { type: 'application/json' }), 'blueprint.json');
  }

  async function download() {
    setBusy(true);
    setError('');
    try {
      const [screenshot, binaries] = await Promise.all([renderScreenshot(state), fetchAssets(assets)]);
      const zip = await buildZip(slug, files, { ...binaries, 'screenshot.png': screenshot });
      saveAs(zip, `${slug}.zip`);
      setDownloaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  /** Replace the draft, keeping a copy so the change can be undone. */
  function withUndo(message: string, change: () => void) {
    const before = structuredClone(pickState(useBuilder.getState()));
    change();
    setUndo({ message, restore: () => useBuilder.setState(before) });
  }

  function startOver() {
    if (confirm(tr('Start over? This clears your info and design in this browser. Your saved designs stay.'))) {
      withUndo(tr('Cleared. Your saved designs are still there.'), reset);
      setDownloaded(false);
      setStep('template');
    }
  }

  const fix = (s: StepKey) => {
    setStep(s);
    setMobileView('edit');
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 lg:flex-row">
      {/* Small screens: one panel at a time. */}
      <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-slate-200 bg-white p-2 lg:hidden" role="tablist" aria-label="Panel">
        {(['edit', 'preview'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={mobileView === v}
            onClick={() => setMobileView(v)}
            className={`rounded-md py-2 text-sm font-semibold ${mobileView === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {v === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      <aside
        className={`${mobileView === 'edit' ? 'flex' : 'hidden'} min-h-0 w-full flex-1 flex-col border-slate-200 bg-white lg:flex lg:w-[440px] lg:flex-none lg:border-r`}
      >
        <header className="space-y-3 border-b border-slate-200 p-4 pb-3 lg:px-6">
          <div className="flex items-center gap-2">
            <h1 className="mr-auto text-xl font-bold">
              <a href="#/" className="hover:text-blue-700" aria-label="FolioBlocks home">
                FolioBlocks
              </a>
            </h1>
            <LangToggle />
            <MoreMenu
              items={[
                { kind: 'button', label: 'Save a backup file', hint: 'Keep your work safe, or continue on another computer.', onClick: exportDraft },
                { kind: 'file', label: 'Open a backup file', hint: 'Continue from a file you saved before.', accept: 'application/json,.json', onFile: importDraft },
                { kind: 'divider' },
                {
                  kind: 'button',
                  label: 'View the theme files',
                  hint: 'The code that goes into your zip.',
                  onClick: () => {
                    setView('code');
                    setMobileView('preview');
                  },
                },
                { kind: 'button', label: 'Download blueprint.json', hint: 'For WordPress Playground (advanced).', onClick: downloadBlueprint },
                { kind: 'divider' },
                { kind: 'button', label: 'Start over', hint: 'Clear your info and design in this browser.', danger: true, onClick: startOver },
              ]}
            />
          </div>
          <SaveStatus onBackup={exportDraft} />
          {changed && source && (
            <p className="text-xs text-slate-600">
              From <span className="font-medium">{source.saved ? source.label : tr(source.label)}</span>, changed ·{' '}
              <button
                type="button"
                className="font-medium text-blue-700 underline"
                onClick={() =>
                  withUndo(tr('Back to {name}. Your info stays.', { name: source.saved ? source.label : tr(source.label) }), () =>
                    source.saved ? useBuilder.getState().applyLayout(preset) : useBuilder.getState().applyPreset(preset),
                  )
                }
              >
                Reset to it
              </button>
            </p>
          )}
          <nav aria-label="Steps">
            <ol className="grid grid-cols-5 gap-1">
              {STEPS.map((s, i) => {
                const current = s.key === step;
                const done = i < stepIndex;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-current={current ? 'step' : undefined}
                      onClick={() => setStep(s.key)}
                      className={`flex w-full flex-col items-center gap-1 rounded-md px-1 py-1.5 text-xs font-medium ${
                        current ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          current ? 'bg-blue-700 text-white' : done ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className="leading-tight">{s.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>

        {/* key={step} remounts the panel so each step starts scrolled to the top. */}
        <div key={step} className="flex-1 overflow-y-auto p-4 lg:p-6">
          {step === 'template' && <TemplateStep onSwitch={withUndo} />}
          {step === 'info' && <InfoStep />}
          {step === 'style' && <StyleStep />}
          {step === 'pages' && <PagesStep />}
          {step === 'publish' && (
            <PublishStep
              items={checklist}
              slug={slug}
              busy={busy}
              error={error}
              downloaded={downloaded}
              onDownload={download}
              onFix={fix}
              onPlayground={openInPlayground}
              guide={
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Put it on your site</h2>
                  <PublishGuide />
                </section>
              }
            />
          )}
          {notice && (
            <p role="status" className="mt-4 text-sm text-green-700">
              {notice}
            </p>
          )}
          {error && step !== 'publish' && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <UndoBar undo={undo} onDone={clearUndo} />
        <footer className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 lg:px-6">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStep(STEPS[stepIndex - 1].key)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:invisible"
          >
            ← Back
          </button>
          {stepIndex < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep(STEPS[stepIndex + 1].key)}
              className="ml-auto rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Next: {STEPS[stepIndex + 1].label} →
            </button>
          )}
        </footer>
      </aside>

      <main className={`${mobileView === 'preview' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col lg:flex`}>
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
          {view === 'preview' ? (
            <p className="text-sm font-semibold text-slate-800">
              Preview <span className="hidden font-normal text-slate-500 sm:inline">· updates as you type</span>
            </p>
          ) : (
            <>
              <button type="button" onClick={() => setView('preview')} className="rounded-md px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50">
                ← Back to preview
              </button>
              <p className="hidden text-xs text-slate-500 sm:block">The {paths.length} theme files that go into your zip.</p>
            </>
          )}
          <button
            type="button"
            onClick={openInPlayground}
            className="ml-auto shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-800 hover:bg-slate-100"
          >
            Open in WordPress Playground ↗
          </button>
        </div>

        {view === 'preview' && <QuickPreview state={state} files={preview.files} assets={preview.assets} />}

        {view === 'code' && (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <nav data-no-translate className="max-h-48 overflow-y-auto border-slate-200 bg-white p-3 md:max-h-none md:w-64 md:border-r">
              {paths.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`block w-full truncate rounded px-2 py-1 text-left font-mono text-xs ${
                    p === selected ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </nav>
            <pre className="min-h-0 flex-1 overflow-auto bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
              {files[selected] ?? (assets.some((a) => a.path === selected) ? '(binary font file, bundled in the zip)' : '')}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
