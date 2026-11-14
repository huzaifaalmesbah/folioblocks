import { SECTION_LABELS, SECTIONS } from '../generator/sections';
import { fontDef } from '../fonts';
import { PRESETS } from '../presets';
import { useBuilder } from '../store';
import type { FooterVariant, HeaderVariant, PageKey } from '../types';
import { SectionTitle, Select } from './fields';

const PAGE_LABELS: Record<PageKey, string> = { home: 'Home page', about: 'About page', contact: 'Contact page' };

export function LayoutStep() {
  const preset = useBuilder((s) => s.preset);
  const header = useBuilder((s) => s.header);
  const footer = useBuilder((s) => s.footer);
  const pages = useBuilder((s) => s.pages);
  const { applyPreset, setHeader, setFooter, setSectionVariant } = useBuilder.getState();

  function choosePreset(key: string) {
    if (key === preset) return;
    if (confirm('Switch layout? This replaces your colours, fonts and section choices. Your info stays.')) {
      applyPreset(key);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Starting layout</SectionTitle>
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
        <SectionTitle>Header & footer</SectionTitle>
        <Select<HeaderVariant>
          label="Header"
          value={header}
          options={[
            { value: 'inline', label: 'Name left, menu right' },
            { value: 'centered', label: 'Centered' },
          ]}
          onChange={setHeader}
        />
        <Select<FooterVariant>
          label="Footer"
          value={footer}
          options={[
            { value: 'centered', label: 'Centered' },
            { value: 'split', label: 'Copyright left, social icons right' },
          ]}
          onChange={setFooter}
        />
      </section>

      {(Object.keys(PAGE_LABELS) as PageKey[]).map((page) => (
        <section key={page} className="space-y-3">
          <SectionTitle>{PAGE_LABELS[page]}</SectionTitle>
          <ol className="space-y-2">
            {pages[page].map((sec, i) => {
              const variants = SECTIONS[sec.type];
              const options = Object.entries(variants).map(([value, v]) => ({ value, label: v.label }));
              return (
                <li key={sec.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {options.length > 1 ? (
                    <Select
                      label={`${i + 1}. ${SECTION_LABELS[sec.type]}`}
                      value={sec.variant}
                      options={options}
                      onChange={(v) => setSectionVariant(page, sec.id, v)}
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      {i + 1}. {SECTION_LABELS[sec.type]}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="text-xs text-slate-500">Adding, removing and reordering sections comes in a later update.</p>
    </div>
  );
}
