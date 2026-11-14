// Copy the bundled OFL variable fonts (latin, normal style) into public/fonts.
// Run after updating any @fontsource-variable package: npm run fonts
import { copyFileSync, mkdirSync } from 'node:fs';

const FONTS = ['inter', 'dm-sans', 'lora', 'playfair-display', 'jetbrains-mono', 'space-grotesk'];
mkdirSync('public/fonts', { recursive: true });
for (const f of FONTS) {
  copyFileSync(`node_modules/@fontsource-variable/${f}/files/${f}-latin-wght-normal.woff2`, `public/fonts/${f}.woff2`);
}
console.log(`Copied ${FONTS.length} fonts to public/fonts`);
