import { FONT_KEYS, FONTS, type FontKey } from '../fonts';
import { LOOK_KEYS, LOOKS } from '../generator/looks';
import { enabledLanguages, languageMeta } from '../i18n/languages';
import { PALETTES } from '../presets';
import { useBuilder } from '../store';
import type { Language, Palette, Radius } from '../types';
import { contrastRatio } from '../color';
import { SectionTitle, Select } from './fields';

const PALETTE_LABELS: Record<keyof Palette, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  base: 'Background',
  contrast: 'Text',
  accent: 'Accent',
};

const RADII: { value: Radius; label: string }[] = [
  { value: 'none', label: 'Square' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Round' },
];

const fontOptions = FONT_KEYS.map((k) => ({ value: k, label: FONTS[k].name }));

function sameColours(a: Palette, b: Palette) {
  return (Object.keys(a) as (keyof Palette)[]).every((k) => a[k].toLowerCase() === b[k].toLowerCase());
}

export function StyleStep() {
  const style = useBuilder((s) => s.style);
  const language = useBuilder((s) => s.language ?? 'en');
  const languages = enabledLanguages();
  const { setPalette, applyPalette, setStyle, setLanguage } = useBuilder.getState();

  const textRatio = contrastRatio(style.palette.contrast, style.palette.base);
  const buttonRatio = contrastRatio(style.palette.base, style.palette.primary);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Colour palettes</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((p) => {
            const active = sameColours(p.palette, style.palette);
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => applyPalette(p.palette)}
                className={`rounded-lg border p-2 text-left text-xs font-medium ${
                  active ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className="mb-1.5 flex overflow-hidden rounded">
                  {(['base', 'accent', 'primary', 'secondary', 'contrast'] as const).map((k) => (
                    <span key={k} className="h-5 flex-1" style={{ background: p.palette[k] }} />
                  ))}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Custom colours</SectionTitle>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(PALETTE_LABELS) as (keyof Palette)[]).map((key) => (
            <label key={key} className="flex flex-col items-center gap-1 text-xs text-slate-600">
              <input
                type="color"
                aria-label={PALETTE_LABELS[key]}
                className="h-10 w-10 cursor-pointer rounded border border-slate-300"
                value={style.palette[key]}
                onChange={(e) => setPalette(key, e.target.value)}
              />
              {PALETTE_LABELS[key]}
            </label>
          ))}
        </div>
        {(textRatio < 4.5 || buttonRatio < 4.5) && (
          <p role="status" className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">
            {textRatio < 4.5 && <>Text on background is hard to read ({textRatio.toFixed(1)}:1, aim for 4.5:1). </>}
            {buttonRatio < 4.5 && <>Button text on Primary is hard to read ({buttonRatio.toFixed(1)}:1).</>}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Fonts</SectionTitle>
        <Select<FontKey>
          label="Headings"
          value={style.fonts.heading}
          options={fontOptions}
          onChange={(heading) => setStyle({ fonts: { ...style.fonts, heading } })}
        />
        <Select<FontKey>
          label="Body text"
          value={style.fonts.body}
          options={fontOptions}
          onChange={(body) => setStyle({ fonts: { ...style.fonts, body } })}
        />
      </section>

      {languages.length > 1 && (
        <section className="space-y-3">
          <SectionTitle>Site language</SectionTitle>
          <Select<Language>
            label="Headings, buttons and menu"
            value={language}
            options={languages.map((l) => ({ value: l.code, label: l.code === l.name ? l.name : `${l.name} (${l.englishName})` }))}
            onChange={(v) => {
              setLanguage(v);
              // Some scripts need a font that has their letters.
              const font = languageMeta(v).font;
              if (font && FONT_KEYS.includes(font as FontKey)) setStyle({ fonts: { heading: font as FontKey, body: font as FontKey } });
            }}
          />
          <p className="text-xs text-slate-500">Your own text is used exactly as you write it, in any language.</p>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>Section style</SectionTitle>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Section style">
          {LOOK_KEYS.map((k) => {
            const active = (style.look ?? 'plain') === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={active}
                title={LOOKS[k].description}
                onClick={() => setStyle({ look: k })}
                className={`rounded-md border px-2 py-2 text-xs ${
                  active ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'
                }`}
              >
                {LOOKS[k].label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">{LOOKS[style.look ?? 'plain'].description}</p>
      </section>

      <section className="space-y-3">
        <SectionTitle>Corners</SectionTitle>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Corner style">
          {RADII.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={style.radius === r.value}
              onClick={() => setStyle({ radius: r.value })}
              className={`rounded-md border px-2 py-2 text-xs ${
                style.radius === r.value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
