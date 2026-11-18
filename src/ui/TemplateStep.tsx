import { useState } from 'react';
import { tr } from '../i18n/ui';
import { fontDef } from '../fonts';
import { presetByKey, PRESETS } from '../presets';
import { useBuilder } from '../store';
import { inputCls, SectionTitle } from './fields';

/** Step 1: pick a design to start from, or one you saved. Your info is never touched. */
export function TemplateStep() {
  const preset = useBuilder((s) => s.preset);
  const savedLayouts = useBuilder((s) => s.savedLayouts);
  const { applyPreset, applyLayout, saveLayout, deleteLayout } = useBuilder.getState();
  const [layoutName, setLayoutName] = useState('');

  function chooseSaved(key: string) {
    if (key === preset) return;
    if (confirm(tr('Use this saved design? Your colours, fonts, section style and page sections change to it. Your info stays.'))) {
      applyLayout(key);
    }
  }

  function choosePreset(key: string) {
    if (key === preset) return;
    if (confirm(tr('Use the {name} template? Your colours, fonts, section style and page sections change to the template\'s. Your info stays.', { name: tr(presetByKey(key).label) }))) {
      applyPreset(key);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Template</SectionTitle>
        <div className="grid gap-2">
          {PRESETS.map((p) => {
            const active = p.key === preset;
            const { palette } = p.style;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => choosePreset(p.key)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left ${
                  active ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-lg font-bold"
                  style={{
                    background: palette.base,
                    color: palette.primary,
                    border: `3px solid ${palette.accent}`,
                    fontFamily: fontDef(p.style.fonts.heading).stack,
                  }}
                >
                  Aa
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{p.label}</span>
                  <span className="block text-xs text-slate-600">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>My saved designs</SectionTitle>
        {savedLayouts.length > 0 && (
          <ul className="space-y-2">
            {savedLayouts.map((l) => (
              <li
                key={l.key}
                className={`flex items-center gap-2 rounded-lg border p-2 ${
                  l.key === preset ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200'
                }`}
              >
                <span aria-hidden className="flex h-8 w-8 shrink-0 overflow-hidden rounded">
                  {(['base', 'primary', 'accent'] as const).map((k) => (
                    <span key={k} className="flex-1" style={{ background: l.style.palette[k] }} />
                  ))}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-slate-800">{l.label}</span>
                <button
                  type="button"
                  onClick={() => chooseSaved(l.key)}
                  disabled={l.key === preset}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                >
                  {l.key === preset ? 'In use' : 'Use'}
                </button>
                <button
                  type="button"
                  aria-label={tr('Delete saved design {name}', { name: l.label })}
                  onClick={() => confirm(tr('Delete the saved design "{name}"?', { name: l.label })) && deleteLayout(l.key)}
                  className="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveLayout(layoutName);
            setLayoutName('');
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Name for this design</span>
            <input
              className={`${inputCls} mt-0`}
              placeholder="Name this design, e.g. Night mode"
              value={layoutName}
              maxLength={60}
              onChange={(e) => setLayoutName(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save current
          </button>
        </form>
        <p className="text-xs text-slate-500">Saves your colours, fonts, section style and sections (not your info) so you can switch back later.</p>
      </section>
    </div>
  );
}
