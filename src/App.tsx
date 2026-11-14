import { useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import { pickState, useBuilder } from './store';
import { generateTheme } from './generator';
import { buildZip } from './zip/buildZip';
import { renderScreenshot } from './zip/screenshot';
import { buildBlueprint, playgroundUrl } from './playground/blueprint';
import type { Palette } from './types';

const PALETTE_LABELS: Record<keyof Palette, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  base: 'Background',
  contrast: 'Text',
  accent: 'Accent',
};

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
  hint?: string;
}) {
  const cls =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30';
  return (
    <label className="block text-sm font-medium text-slate-700">
      {props.label}
      {props.textarea ? (
        <textarea className={cls} rows={3} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input
          className={cls}
          type={props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
      {props.hint && <span className="mt-1 block text-xs font-normal text-slate-500">{props.hint}</span>}
    </label>
  );
}

export default function App() {
  const store = useBuilder();
  const { info, style } = store;
  const state = pickState(store);
  const { preset, pages } = store;
  const { slug, files } = useMemo(
    () => generateTheme({ info, style, preset, pages }),
    [info, style, preset, pages],
  );
  const paths = Object.keys(files).sort();
  const [selected, setSelected] = useState('theme.json');
  const [busy, setBusy] = useState(false);

  function openInPlayground() {
    const url = playgroundUrl(buildBlueprint(state, slug, files));
    window.open(url, '_blank', 'noopener');
  }

  function downloadBlueprint() {
    const json = JSON.stringify(buildBlueprint(state, slug, files), null, 2);
    saveAs(new Blob([json], { type: 'application/json' }), 'blueprint.json');
  }

  async function download() {
    setBusy(true);
    try {
      const screenshot = await renderScreenshot(state);
      const zip = await buildZip(slug, files, { 'screenshot.png': screenshot });
      saveAs(zip, `${slug}.zip`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 lg:h-screen lg:flex-row">
      <aside className="w-full space-y-6 overflow-y-auto border-slate-200 bg-white p-6 lg:w-[420px] lg:border-r">
        <header>
          <h1 className="text-2xl font-bold">FolioBlocks</h1>
          <p className="text-sm text-slate-600">Build your WordPress portfolio theme, no code needed.</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your info</h2>
          <Field label="Full name" value={info.name} onChange={(name) => store.setInfo({ name })} />
          <Field label="Tagline" value={info.tagline} onChange={(tagline) => store.setInfo({ tagline })} />
          <Field label="University" value={info.university} onChange={(university) => store.setInfo({ university })} />
          <Field label="Location" value={info.location} onChange={(location) => store.setInfo({ location })} />
          <Field label="Short bio" textarea value={info.bio} onChange={(bio) => store.setInfo({ bio })} />
          <Field label="Email" type="email" value={info.email} onChange={(email) => store.setInfo({ email })} />
          <Field
            label="Skills"
            hint="Separate with commas"
            value={info.skills.join(', ')}
            onChange={(v) => store.setInfo({ skills: v.split(',').map((s) => s.trim()).filter(Boolean) })}
          />
          <Field
            label="GitHub URL"
            value={info.socials.github ?? ''}
            onChange={(github) => store.setInfo({ socials: { ...info.socials, github } })}
          />
          <Field
            label="WordPress.org profile URL"
            value={info.socials.wordpress ?? ''}
            onChange={(wordpress) => store.setInfo({ socials: { ...info.socials, wordpress } })}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colours</h2>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(PALETTE_LABELS) as (keyof Palette)[]).map((key) => (
              <label key={key} className="flex flex-col items-center gap-1 text-xs text-slate-600">
                <input
                  type="color"
                  aria-label={PALETTE_LABELS[key]}
                  className="h-10 w-10 cursor-pointer rounded border border-slate-300"
                  value={style.palette[key]}
                  onChange={(e) => store.setPalette(key, e.target.value)}
                />
                {PALETTE_LABELS[key]}
              </label>
            ))}
          </div>
        </section>

        <div className="space-y-2">
          <button
            onClick={openInPlayground}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Open in WordPress Playground ↗
          </button>
          <p className="text-xs text-slate-500">
            Opens a real WordPress in a new tab with your theme installed, plus Home, About, Blog, Contact pages and
            sample posts. Nothing to install.{' '}
            <button onClick={downloadBlueprint} className="underline hover:text-slate-700">
              Download blueprint.json
            </button>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={download}
            disabled={busy}
            className="flex-1 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {busy ? 'Building…' : `Download ${slug}.zip`}
          </button>
          <button
            onClick={() => confirm('Reset everything to the defaults?') && store.reset()}
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
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
            {files[selected] ?? ''}
          </pre>
        </div>
      </main>
    </div>
  );
}
