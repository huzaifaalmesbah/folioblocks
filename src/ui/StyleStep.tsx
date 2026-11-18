import { useState } from 'react';
import { FONT_KEYS, FONT_PAIRS, FONTS, fontDef, type FontKey } from '../fonts';
import { LOOK_KEYS, LOOKS } from '../generator/looks';
import { enabledLanguages, languageMeta } from '../i18n/languages';
import { PALETTES } from '../presets';
import { sourceDesign, useBuilder } from '../store';
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

/** The palettes shown first: popular, readable, different from each other. The template's own colours come first. */
const FEATURED = ['wordpress-blue', 'sunset', 'midnight', 'forest', 'rose', 'ocean', 'mono', 'electric'];

const choice = (active: boolean) =>
  `rounded-lg border p-2 text-left text-xs font-medium ${active ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-slate-200 hover:border-slate-400'}`;

/**
 * Step 3: colours and fonts first, eight colours and six font pairs; the
 * rest (all palettes, custom colours, separate fonts, section style,
 * corners) waits under More options.
 */
export function StyleStep() {
  const style = useBuilder((s) => s.style);
  const preset = useBuilder((s) => s.preset);
  const savedLayouts = useBuilder((s) => s.savedLayouts);
  const language = useBuilder((s) => s.language ?? 'en');
  const languages = enabledLanguages();
  const { setPalette, applyPalette, setStyle, setLanguage } = useBuilder.getState();
  const [allColours, setAllColours] = useState(false);

  const textRatio = contrastRatio(style.palette.contrast, style.palette.base);
  const buttonRatio = contrastRatio(style.palette.base, style.palette.primary);

  // The template's (or saved design's) own colours, first in the list.
  const source = sourceDesign({ preset }, savedLayouts);
  const own = source && !PALETTES.some((p) => sameColours(p.palette, source.style.palette)) ? { key: 'own', label: 'Template colours', palette: source.style.palette } : null;
  const ownKey = source ? PALETTES.find((p) => sameColours(p.palette, source.style.palette))?.key : undefined;
  const ordered = [...(own ? [own] : []), ...PALETTES.filter((p) => p.key === ownKey), ...PALETTES.filter((p) => p.key !== ownKey && FEATURED.includes(p.key)), ...PALETTES.filter((p) => p.key !== ownKey && !FEATURED.includes(p.key))];
  const palettes = allColours ? ordered : ordered.slice(0, 8);
  const customColours = !ordered.some((p) => sameColours(p.palette, style.palette));

  // The template's own fonts come first when they aren't one of the pairs.
  const sourceFonts = source?.style.fonts;
  const pairs = [
    ...(sourceFonts && !FONT_PAIRS.some((p) => p.heading === sourceFonts.heading && p.body === sourceFonts.body)
      ? [{ key: 'own', label: 'Template fonts', heading: sourceFonts.heading, body: sourceFonts.body }]
      : []),
    ...FONT_PAIRS,
  ];
  const pair = pairs.find((p) => p.heading === style.fonts.heading && p.body === style.fonts.body);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>Colours</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {palettes.map((p) => {
            const active = sameColours(p.palette, style.palette);
            return (
              <button key={p.key} type="button" aria-pressed={active} onClick={() => applyPalette(p.palette)} className={choice(active)}>
                <span className="mb-1.5 flex overflow-hidden rounded">
                  {(['base', 'accent', 'primary', 'secondary', 'contrast'] as const).map((k) => (
                    <span key={k} className="h-5 flex-1" style={{ background: p.palette[k] }} />
                  ))}
                </span>
                {p.label}
                {p.key === ownKey && <span className="text-slate-500"> · template</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setAllColours((v) => !v)} className="text-xs font-medium text-blue-700 underline">
            {allColours ? 'Show fewer colours' : `Show all colours (${ordered.length})`}
          </button>
          {customColours && <span className="text-xs text-slate-500">Using your own colours</span>}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Fonts</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {pairs.map((p) => {
            const active = pair?.key === p.key;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStyle({ fonts: { heading: p.heading, body: p.body } })}
                className={choice(active)}
              >
                <span className="block text-lg leading-tight text-slate-900" style={{ fontFamily: fontDef(p.heading).stack }}>
                  Aa
                </span>
                <span className="block">{p.label}</span>
                <span className="block font-normal text-slate-500" data-no-translate>
                  {fontDef(p.heading).name}
                </span>
              </button>
            );
          })}
        </div>
        {!pair && (
          <p className="text-xs text-slate-500">
            Using your own fonts: {fontDef(style.fonts.heading).name} and {fontDef(style.fonts.body).name}.
          </p>
        )}
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

      <details className="group rounded-xl border border-slate-200" open={customColours || !pair || undefined}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-900">More options</span>
            <span className="block text-xs text-slate-500">Your own colours, separate fonts, section style and corners.</span>
          </span>
          <span aria-hidden className="text-slate-400 transition group-open:rotate-90">›</span>
        </summary>
        <div className="space-y-6 px-4 pb-4">
          <section className="space-y-3">
            <SectionTitle>Your own colours</SectionTitle>
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
            <SectionTitle>Separate fonts</SectionTitle>
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
                    className={`rounded-md border px-2 py-2 text-xs ${active ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 text-slate-700'}`}
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
      </details>
    </div>
  );
}
