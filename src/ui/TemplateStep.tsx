import { useState } from 'react';
import { tr } from '../i18n/ui';
import { PRESETS, TRACKS, type Track } from '../presets';
import { useBuilder } from '../store';
import { DesignMock } from './DesignMock';
import { inputCls, SectionTitle } from './fields';

/**
 * Step 1: pick a design to start from, or one you saved. Your info is never
 * touched. Switching is instant and needs no undo: a changed design is kept
 * in My saved designs first.
 */
export function TemplateStep() {
  const preset = useBuilder((s) => s.preset);
  const savedLayouts = useBuilder((s) => s.savedLayouts);
  const { applyPreset, applyLayout, saveLayout, deleteLayout } = useBuilder.getState();
  const [layoutName, setLayoutName] = useState('');
  const [track, setTrack] = useState<Track | 'all'>('all');

  const shown = PRESETS.filter((p) => track === 'all' || p.tracks.includes(track));

  function choosePreset(key: string) {
    if (key === preset) return;
    applyPreset(key);
  }

  function chooseSaved(key: string) {
    if (key === preset) return;
    applyLayout(key);
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-medium ${active ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Pick a template</h2>
          <p className="text-sm text-slate-600">A starting point. Colours, fonts and sections can all be changed in the next steps; your info always stays.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show templates for">
          <button type="button" aria-pressed={track === 'all'} onClick={() => setTrack('all')} className={chip(track === 'all')}>
            All
          </button>
          {TRACKS.map((t) => (
            <button key={t.key} type="button" aria-pressed={track === t.key} onClick={() => setTrack(t.key)} className={chip(track === t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {shown.map((p) => {
            const active = p.key === preset;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => choosePreset(p.key)}
                className={`flex flex-col rounded-xl border p-2 text-left transition ${
                  active ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <DesignMock p={p} />
                <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  {p.label}
                  {active && <span className="rounded bg-blue-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">In use</span>}
                </span>
                <span className="text-xs text-slate-600">{p.bestFor}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>My saved designs</SectionTitle>
        {savedLayouts.length === 0 && (
          <p className="text-xs text-slate-500">Nothing saved yet. Save your design below to switch back to it later.</p>
        )}
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
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{l.label}</span>
                  {l.auto && <span className="block text-xs text-slate-500">Kept automatically before a switch</span>}
                </span>
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
          <button type="submit" className="shrink-0 rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-700">
            Save current
          </button>
        </form>
        <p className="text-xs text-slate-500">Saves your colours, fonts, section style and sections (not your info) so you can switch back later.</p>
      </section>
    </div>
  );
}
