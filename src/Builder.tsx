import { useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { pickState, useBuilder } from './store';
import { generateTheme } from './generator';
import { buildZip } from './zip/buildZip';
import { renderScreenshot } from './zip/screenshot';
import { fetchAssets } from './zip/assets';
import { buildBlueprint, playgroundUrl } from './playground/blueprint';
import { exportSettings, parseSettings } from './layout';
import { InfoStep } from './ui/InfoStep';
import { StyleStep } from './ui/StyleStep';
import { LayoutStep } from './ui/LayoutStep';
import { QuickPreview } from './preview/QuickPreview';
import { publishChecklist } from './checklist';
import { DownloadDialog } from './ui/DownloadDialog';

type View = 'preview' | 'code';

const VIEWS: { key: View; label: string }[] = [
  { key: 'preview', label: 'Preview' },
  { key: 'code', label: 'Code' },
];

const STEPS = [
  { key: 'info', label: '1. Info', Component: InfoStep },
  { key: 'style', label: '2. Style', Component: StyleStep },
  { key: 'layout', label: '3. Layout', Component: LayoutStep },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export function Builder() {
  const info = useBuilder((s) => s.info);
  const language = useBuilder((s) => s.language);
  const style = useBuilder((s) => s.style);
  const preset = useBuilder((s) => s.preset);
  const header = useBuilder((s) => s.header);
  const footer = useBuilder((s) => s.footer);
  const pages = useBuilder((s) => s.pages);
  const reset = useBuilder((s) => s.reset);

  const state = useMemo(
    () => pickState({ info, language, style, preset, header, footer, pages }),
    [info, language, style, preset, header, footer, pages],
  );
  const { slug, files, assets } = useMemo(() => generateTheme(state), [state]);
  // The preview fills empty parts with sample content; the theme above leaves them out.
  const preview = useMemo(() => generateTheme(state, { samples: true }), [state]);
  const paths = [...Object.keys(files), ...assets.map((a) => a.path)].sort();

  const [step, setStep] = useState<StepKey>('info');
  const [selected, setSelected] = useState('theme.json');
  const [view, setView] = useState<View>('preview');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Download opens a dialog: a pre-flight check, then what to do next.
  const [dialog, setDialog] = useState<'closed' | 'check' | 'done'>('closed');
  const checklist = useMemo(() => publishChecklist(state), [state]);
  // On small screens the form and the preview take turns.
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');

  const Current = STEPS.find((s) => s.key === step)!.Component;
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
      if (!confirm('Load this draft? It replaces your info and design. Your saved layouts are kept.')) return;
      useBuilder.getState().importSettings(parsed.state, parsed.layouts);
      setNotice(`Loaded ${file.name}.`);
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
      setDialog('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900 lg:flex-row">
      <DownloadDialog
        open={dialog !== 'closed'}
        phase={dialog === 'done' ? 'done' : 'check'}
        items={checklist}
        slug={slug}
        busy={busy}
        error={error}
        onDownload={download}
        onFix={(s) => {
          setStep(s);
          setMobileView('edit');
          setDialog('closed');
        }}
        onPlayground={openInPlayground}
        onClose={() => setDialog('closed')}
      />

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
        <header className="space-y-3 border-b border-slate-200 p-4 pb-3 lg:p-6 lg:pb-4">
          <div>
            <h1 className="text-2xl font-bold">
              <a href="#/" className="hover:text-blue-700" aria-label="FolioBlocks home">
                FolioBlocks
              </a>
            </h1>
            <p className="hidden text-sm text-slate-600 lg:block">Build your WordPress portfolio theme, no code needed.</p>
          </div>
          <nav className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1" aria-label="Steps">
            {STEPS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-current={s.key === step ? 'step' : undefined}
                onClick={() => setStep(s.key)}
                className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                  s.key === step ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </header>

        {/* key={step} remounts the panel so each step starts scrolled to the top. */}
        <div key={step} className="flex-1 overflow-y-auto p-6">
          <Current />
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStep(STEPS[stepIndex - 1].key)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:invisible"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={stepIndex === STEPS.length - 1}
              onClick={() => setStep(STEPS[stepIndex + 1].key)}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 disabled:invisible"
            >
              Next →
            </button>
          </div>
        </div>

        <footer className="space-y-2 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={openInPlayground}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Open in WordPress Playground ↗
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setDialog('check');
              }}
              disabled={busy}
              className="flex-1 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              Download {slug}.zip
            </button>
            <button
              type="button"
              onClick={() => confirm('Reset everything to the defaults?') && reset()}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
          {error && dialog === 'closed' && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <button type="button" onClick={exportDraft} className="underline hover:text-slate-700">
              Save draft (.json)
            </button>
            <label className="cursor-pointer underline hover:text-slate-700 focus-within:ring-2 focus-within:ring-blue-600/30">
              Load draft
              <input type="file" accept="application/json,.json" className="sr-only" onChange={importDraft} />
            </label>
            <button type="button" onClick={downloadBlueprint} className="underline hover:text-slate-700">
              Download blueprint.json
            </button>
          </p>
          {notice && (
            <p role="status" className="text-xs text-green-700">
              {notice}
            </p>
          )}
        </footer>
      </aside>

      <main className={`${mobileView === 'preview' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 flex-col lg:flex`}>
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Right panel">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={view === v.key}
                onClick={() => setView(v.key)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  view === v.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.key === 'code' ? (
                  <>
                    Code<span className="hidden sm:inline"> ({paths.length} files)</span>
                  </>
                ) : (
                  v.label
                )}
              </button>
            ))}
          </div>
          <p className="hidden text-xs text-slate-500 xl:block">
            {view === 'preview' ? 'Updates as you type.' : 'The theme files that go into your zip.'}
          </p>
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
            <nav className="max-h-48 overflow-y-auto border-slate-200 bg-white p-3 md:max-h-none md:w-64 md:border-r">
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
