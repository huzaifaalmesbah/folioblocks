import { useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { pickState, useBuilder } from './store';
import { generateTheme } from './generator';
import { buildZip } from './zip/buildZip';
import { renderScreenshot } from './zip/screenshot';
import { fetchAssets } from './zip/assets';
import { buildBlueprint, playgroundUrl } from './playground/blueprint';
import { InfoStep } from './ui/InfoStep';
import { StyleStep } from './ui/StyleStep';
import { LayoutStep } from './ui/LayoutStep';

const STEPS = [
  { key: 'info', label: '1. Info', Component: InfoStep },
  { key: 'style', label: '2. Style', Component: StyleStep },
  { key: 'layout', label: '3. Layout', Component: LayoutStep },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export default function App() {
  const info = useBuilder((s) => s.info);
  const style = useBuilder((s) => s.style);
  const preset = useBuilder((s) => s.preset);
  const header = useBuilder((s) => s.header);
  const footer = useBuilder((s) => s.footer);
  const pages = useBuilder((s) => s.pages);
  const reset = useBuilder((s) => s.reset);

  const state = useMemo(
    () => pickState({ info, style, preset, header, footer, pages }),
    [info, style, preset, header, footer, pages],
  );
  const { slug, files, assets } = useMemo(() => generateTheme(state), [state]);
  const paths = [...Object.keys(files), ...assets.map((a) => a.path)].sort();

  const [step, setStep] = useState<StepKey>('info');
  const [selected, setSelected] = useState('theme.json');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const Current = STEPS.find((s) => s.key === step)!.Component;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function openInPlayground() {
    window.open(playgroundUrl(buildBlueprint(state, slug, files, assets)), '_blank', 'noopener');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:h-screen lg:flex-row">
      <aside className="flex w-full flex-col border-slate-200 bg-white lg:w-[440px] lg:border-r">
        <header className="space-y-3 border-b border-slate-200 p-6 pb-4">
          <div>
            <h1 className="text-2xl font-bold">FolioBlocks</h1>
            <p className="text-sm text-slate-600">Build your WordPress portfolio theme, no code needed.</p>
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
              onClick={download}
              disabled={busy}
              className="flex-1 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {busy ? 'Building…' : `Download ${slug}.zip`}
            </button>
            <button
              type="button"
              onClick={() => confirm('Reset everything to the defaults?') && reset()}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Playground opens a real WordPress in a new tab with your theme, pages and sample posts.{' '}
            <button type="button" onClick={downloadBlueprint} className="underline hover:text-slate-700">
              Download blueprint.json
            </button>
          </p>
        </footer>
      </aside>

      <main className="flex min-h-[60vh] flex-1 flex-col lg:min-h-0">
        <div className="border-b border-slate-200 bg-white px-6 py-3 text-sm text-slate-600">
          Generated theme files: <strong>{paths.length}</strong> · use “Open in WordPress Playground” to see it live
        </div>
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
      </main>
    </div>
  );
}
