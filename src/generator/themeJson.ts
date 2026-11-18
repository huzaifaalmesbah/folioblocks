import { luminance } from '../color';
import { fontDef, fontPath, type FontKey } from '../fonts';
import { PALETTES } from '../presets';
import type { Palette, Style } from '../types';
import { mergeJson, type LookDef } from './looks';

/**
 * theme.json points at the trunk schema, as Ipsum does: "$schema" only drives
 * editor autocomplete, and our validator still checks the file against the
 * schema of the "Requires at least" version in style.css.
 */
export const THEME_JSON_SCHEMA = 'https://schemas.wp.org/trunk/theme.json';

export const RADIUS: Record<Style['radius'], string> = { none: '0', sm: '4px', md: '10px', lg: '24px' };

/** "#1e1e1e" + "33" → "#1e1e1e33" (20% opacity), for translucent lines. */
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}

/**
 * The palette uses Twenty Twenty-Five's slugs, like Ipsum, so core and
 * default-theme patterns pick up the student's colours:
 * base (background), contrast (text), accent-1 (primary: links, buttons),
 * accent-3 (secondary: hover), accent-5 (surface: cards, bands), accent-6 (border: lines).
 */
export function paletteEntries(p: Palette) {
  return [
    { slug: 'base', name: 'Base', color: p.base },
    { slug: 'contrast', name: 'Contrast', color: p.contrast },
    { slug: 'accent-1', name: 'Primary', color: p.primary },
    { slug: 'accent-3', name: 'Secondary', color: p.secondary },
    { slug: 'accent-5', name: 'Surface', color: p.accent },
    { slug: 'accent-6', name: 'Border', color: withAlpha(p.contrast, '33') },
  ];
}

/** "light" or "dark", read from the background (Ipsum's settings.custom.controlScheme). */
export function controlScheme(p: Palette): 'light' | 'dark' {
  return luminance(p.base) < 0.5 ? 'dark' : 'light';
}

/** Ipsum's spacing scale: 20 and 30 fixed, 40 and up scale with the viewport. */
const SPACING_SIZES = [
  { name: '2X-Small', size: '8px', slug: '20' },
  { name: 'X-Small', size: '16px', slug: '30' },
  { name: 'Small', size: 'clamp(24px, 2.33vw, 32px)', slug: '40' },
  { name: 'Regular', size: 'clamp(32px, 3.49vw, 48px)', slug: '50' },
  { name: 'Large', size: 'clamp(48px, 4.65vw, 64px)', slug: '60' },
  { name: 'X-Large', size: 'clamp(64px, 6.98vw, 96px)', slug: '70' },
  { name: '2X-Large', size: 'clamp(80px, 9.3vw, 128px)', slug: '80' },
];

const color = (slug: string) => `var:preset|color|${slug}`;

export function themeJson(style: Style, look: Pick<LookDef, 'settings' | 'styles'> = {}): string {
  const { palette, fonts } = style;
  const fontKeys = Array.from(new Set<FontKey>([fonts.heading, fonts.body]));

  const json = {
    $schema: THEME_JSON_SCHEMA,
    version: 3,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      layout: { contentSize: '720px', wideSize: '1280px' },
      color: {
        defaultPalette: false,
        defaultGradients: false,
        defaultDuotone: false,
        palette: paletteEntries(palette),
      },
      custom: { controlScheme: controlScheme(palette) },
      spacing: {
        defaultSpacingSizes: false,
        spacingSizes: SPACING_SIZES,
        units: ['px', 'rem', 'em', '%', 'vw', 'vh'],
      },
      typography: {
        fluid: true,
        defaultFontSizes: false,
        fontFamilies: fontKeys.map((k) => {
          const f = fontDef(k);
          return {
            ...(f.file && {
              fontFace: [
                {
                  fontFamily: f.name,
                  fontStretch: 'normal',
                  fontStyle: 'normal',
                  fontWeight: f.weight,
                  fontDisplay: 'swap',
                  src: [`file:./${fontPath(k)}`],
                },
              ],
            }),
            fontFamily: f.stack,
            name: f.name,
            slug: k,
          };
        }),
        fontSizes: [
          { slug: 'small', name: 'Small', size: '0.875rem', fluid: false },
          { slug: 'medium', name: 'Medium', size: '1.125rem', fluid: false },
          { slug: 'large', name: 'Large', size: '1.5rem', fluid: { min: '1.25rem', max: '1.75rem' } },
          { slug: 'x-large', name: 'X-Large', size: '2.25rem', fluid: { min: '1.75rem', max: '2.75rem' } },
          { slug: 'xx-large', name: '2X-Large', size: '3.5rem', fluid: { min: '2.5rem', max: '4.5rem' } },
        ],
      },
    },
    styles: {
      color: { background: color('base'), text: color('contrast') },
      spacing: {
        blockGap: 'var:preset|spacing|40',
        padding: { left: 'var:preset|spacing|40', right: 'var:preset|spacing|40' },
      },
      typography: {
        fontFamily: `var:preset|font-family|${fonts.body}`,
        fontSize: 'var:preset|font-size|medium',
        lineHeight: '1.6',
      },
      elements: {
        heading: {
          typography: { fontFamily: `var:preset|font-family|${fonts.heading}`, fontWeight: '700', lineHeight: 'calc(1em + 0.5rem)' },
        },
        h1: { typography: { fontSize: 'var:preset|font-size|xx-large', letterSpacing: '-0.02rem' } },
        h2: { typography: { fontSize: 'var:preset|font-size|x-large', letterSpacing: '-0.02rem' } },
        h3: { typography: { fontSize: 'var:preset|font-size|large', letterSpacing: '-0.01rem' } },
        link: {
          color: { text: color('accent-1') },
          ':hover': { color: { text: color('accent-3') }, typography: { textDecoration: 'none' } },
        },
        button: {
          color: { background: color('accent-1'), text: color('base') },
          border: { radius: RADIUS[style.radius] },
          ':hover': { color: { background: color('accent-3'), text: color('base') } },
          ':focus': { outline: { color: 'currentColor', offset: '-4px', style: 'dotted', width: '1px' } },
        },
      },
      blocks: {
        'core/site-title': { typography: { fontWeight: '700', fontSize: 'var:preset|font-size|medium' } },
        'core/post-date': { typography: { fontSize: 'var:preset|font-size|small', fontWeight: '600' } },
        'core/post-terms': { typography: { fontSize: 'var:preset|font-size|small', fontWeight: '600' } },
        'core/separator': { color: { text: color('accent-6') }, border: { width: '1px' } },
        // Set corners here once instead of on every image (Ipsum's rule for repeated block styles).
        'core/image': { border: { radius: RADIUS[style.radius] } },
        'core/post-featured-image': { border: { radius: RADIUS[style.radius] } },
      },
    },
    customTemplates: [
      { name: 'page-about', title: 'About', postTypes: ['page'] },
      { name: 'page-contact', title: 'Contact', postTypes: ['page'] },
    ],
    templateParts: [
      { area: 'header', name: 'header', title: 'Header' },
      { area: 'footer', name: 'footer', title: 'Footer' },
    ],
  };

  // The look's presets and styles go on top (generator/looks.ts).
  const merged = {
    ...json,
    settings: look.settings ? mergeJson(json.settings, look.settings(style)) : json.settings,
    styles: look.styles ? mergeJson(json.styles, look.styles(style)) : json.styles,
  };
  return `${JSON.stringify(merged, null, '\t')}\n`;
}

/**
 * Colour style variations, like Ipsum's styles/colors/*.json: every other
 * FolioBlocks palette, so the student can switch colours later in
 * Appearance → Editor → Styles. Number-prefixed to keep their order.
 */
export function colorVariations(style: Style): Record<string, string> {
  const same = (a: Palette, b: Palette) =>
    (Object.keys(a) as (keyof Palette)[]).every((k) => a[k].toLowerCase() === b[k].toLowerCase());
  const files: Record<string, string> = {};
  PALETTES.filter((p) => !same(p.palette, style.palette)).forEach((p, i) => {
    const json = {
      $schema: THEME_JSON_SCHEMA,
      version: 3,
      title: p.label,
      settings: {
        custom: { controlScheme: controlScheme(p.palette) },
        color: { palette: paletteEntries(p.palette) },
      },
    };
    files[`styles/colors/${String(i + 1).padStart(2, '0')}-${p.key}.json`] = `${JSON.stringify(json, null, '\t')}\n`;
  });
  return files;
}
