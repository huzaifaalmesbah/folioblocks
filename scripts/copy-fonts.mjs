// Copy the bundled OFL variable fonts (normal style) into public/fonts.
// Run after updating any @fontsource-variable package: npm run fonts
import { copyFileSync, mkdirSync } from 'node:fs';

// name → subset. Latin for most; the Bengali font ships its Bengali glyphs,
// and Latin text falls back to the next font in its stack.
const FONTS = {
  inter: 'latin',
  'dm-sans': 'latin',
  lora: 'latin',
  'playfair-display': 'latin',
  'jetbrains-mono': 'latin',
  'space-grotesk': 'latin',
  'noto-sans-bengali': 'bengali',
};
mkdirSync('public/fonts', { recursive: true });
for (const [f, subset] of Object.entries(FONTS)) {
  copyFileSync(`node_modules/@fontsource-variable/${f}/files/${f}-${subset}-wght-normal.woff2`, `public/fonts/${f}.woff2`);
}
console.log(`Copied ${Object.keys(FONTS).length} fonts to public/fonts`);
