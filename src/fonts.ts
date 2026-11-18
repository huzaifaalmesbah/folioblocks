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
  /** Copyright line and source, credited under == Fonts == in readme.txt. */
  copyright?: string;
  source?: string;
};

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif';
const SERIF = 'Iowan Old Style, "Apple Garamond", Baskerville, "Times New Roman", "Droid Serif", Times, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const FONTS = {
  'system-sans': { name: 'System Sans', stack: SANS, category: 'sans' },
  'system-serif': { name: 'System Serif', stack: SERIF, category: 'serif' },
  'system-mono': { name: 'System Mono', stack: MONO, category: 'mono' },
  inter: { name: 'Inter', stack: `"Inter", ${SANS}`, category: 'sans', file: 'inter.woff2', weight: '100 900', copyright: "Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)", source: "https://rsms.me/inter/" },
  'dm-sans': { name: 'DM Sans', stack: `"DM Sans", ${SANS}`, category: 'sans', file: 'dm-sans.woff2', weight: '100 1000', copyright: "Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts)", source: "https://github.com/googlefonts/dm-fonts" },
  'space-grotesk': {
    name: 'Space Grotesk',
    stack: `"Space Grotesk", ${SANS}`,
    category: 'sans',
    file: 'space-grotesk.woff2',
    weight: '300 700', copyright: "Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk)", source: "https://github.com/floriankarsten/space-grotesk",
  },
  lora: { name: 'Lora', stack: `"Lora", ${SERIF}`, category: 'serif', file: 'lora.woff2', weight: '400 700', copyright: "Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name \"Lora\".", source: "https://github.com/cyrealtype/Lora-Cyrillic" },
  'playfair-display': {
    name: 'Playfair Display',
    stack: `"Playfair Display", ${SERIF}`,
    category: 'serif',
    file: 'playfair-display.woff2',
    weight: '400 900', copyright: "Copyright 2017 The Playfair Display Project Authors (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name \"Playfair Display\".", source: "https://github.com/clauseggers/Playfair-Display",
  },
  'jetbrains-mono': {
    name: 'JetBrains Mono',
    stack: `"JetBrains Mono", ${MONO}`,
    category: 'mono',
    file: 'jetbrains-mono.woff2',
    weight: '100 800', copyright: "Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)", source: "https://www.jetbrains.com/lp/mono/",
  },
  // Bengali glyphs only; Latin letters and digits fall back to the system sans.
  'noto-sans-bengali': {
    name: 'Noto Sans Bengali',
    stack: `"Noto Sans Bengali", ${SANS}`,
    category: 'sans',
    file: 'noto-sans-bengali.woff2',
    weight: '100 900',
    copyright: 'Copyright 2025 The Noto Project Authors (https://github.com/notofonts/bengali)',
    source: 'https://github.com/notofonts/bengali',
  },
} satisfies Record<string, FontDef>;

export type FontKey = keyof typeof FONTS;

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export function fontDef(key: FontKey): FontDef {
  return FONTS[key] ?? FONTS['system-sans'];
}

/**
 * A binary file the theme ships: where it goes in the theme, and where its
 * bytes come from: a file the app serves from public/ (`src`), or a data URL
 * the student uploaded (`data`).
 */
export type ThemeAsset = { path: string; src?: string; data?: string };

/**
 * Font files a set of fonts needs. Like Ipsum, each family gets its own
 * folder: assets/fonts/inter/inter-var-normal.woff2.
 */
export function fontAssets(keys: FontKey[]): ThemeAsset[] {
  const seen = new Map<string, ThemeAsset>();
  for (const k of keys) {
    const f = fontDef(k);
    if (f.file && !seen.has(k)) seen.set(k, { path: fontPath(k), src: `fonts/${f.file}` });
  }
  return [...seen.values()];
}

/** The theme-relative path of a bundled font. */
export function fontPath(key: FontKey): string {
  return `assets/fonts/${key}/${key}-var-normal.woff2`;
}

/**
 * Font pairs for the Style step: one click sets headings and body text.
 * Fewer, safer choices than two lists of every font; the lists are still
 * there under More options.
 */
export const FONT_PAIRS: { key: string; label: string; heading: FontKey; body: FontKey }[] = [
  { key: 'clean', label: 'Clean', heading: 'inter', body: 'inter' },
  { key: 'friendly', label: 'Friendly', heading: 'dm-sans', body: 'dm-sans' },
  { key: 'modern', label: 'Modern', heading: 'space-grotesk', body: 'inter' },
  { key: 'classic', label: 'Classic', heading: 'lora', body: 'inter' },
  { key: 'elegant', label: 'Elegant', heading: 'playfair-display', body: 'inter' },
  { key: 'code', label: 'Code', heading: 'jetbrains-mono', body: 'inter' },
];
