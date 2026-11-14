/**
 * Fonts a student can pick. System stacks need no files; the others are
 * OFL-licensed variable fonts bundled into the theme (assets/fonts/*.woff2)
 * so the theme never loads fonts from a third-party CDN.
 */
export type FontDef = {
  name: string;
  stack: string;
  category: 'sans' | 'serif' | 'mono';
  /** File name in public/fonts and in the theme's assets/fonts. */
  file?: string;
  /** Variable weight range, e.g. "100 900". */
  weight?: string;
};

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
const SERIF = 'Iowan Old Style, "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const FONTS = {
  'system-sans': { name: 'System Sans', stack: SANS, category: 'sans' },
  'system-serif': { name: 'System Serif', stack: SERIF, category: 'serif' },
  'system-mono': { name: 'System Mono', stack: MONO, category: 'mono' },
  inter: { name: 'Inter', stack: `"Inter", ${SANS}`, category: 'sans', file: 'inter.woff2', weight: '100 900' },
  'dm-sans': { name: 'DM Sans', stack: `"DM Sans", ${SANS}`, category: 'sans', file: 'dm-sans.woff2', weight: '100 1000' },
  'space-grotesk': {
    name: 'Space Grotesk',
    stack: `"Space Grotesk", ${SANS}`,
    category: 'sans',
    file: 'space-grotesk.woff2',
    weight: '300 700',
  },
  lora: { name: 'Lora', stack: `"Lora", ${SERIF}`, category: 'serif', file: 'lora.woff2', weight: '400 700' },
  'playfair-display': {
    name: 'Playfair Display',
    stack: `"Playfair Display", ${SERIF}`,
    category: 'serif',
    file: 'playfair-display.woff2',
    weight: '400 900',
  },
  'jetbrains-mono': {
    name: 'JetBrains Mono',
    stack: `"JetBrains Mono", ${MONO}`,
    category: 'mono',
    file: 'jetbrains-mono.woff2',
    weight: '100 800',
  },
} satisfies Record<string, FontDef>;

export type FontKey = keyof typeof FONTS;

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export function fontDef(key: FontKey): FontDef {
  return FONTS[key] ?? FONTS['system-sans'];
}

/** Theme-relative paths of the font files a set of fonts needs. */
export function fontAssets(keys: FontKey[]): string[] {
  const files = new Set<string>();
  for (const k of keys) {
    const f = fontDef(k).file;
    if (f) files.add(`assets/fonts/${f}`);
  }
  return [...files];
}
