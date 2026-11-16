/**
 * Export a theme for every layout preset (plus header/footer variants) and
 * check each one with Ipsum's validator (scripts/validate-theme.mjs):
 * theme.json and style variations against the schema, pattern headers,
 * block markup, editor leftovers and untranslated text.
 *
 * Usage: npm run validate
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { generateTheme } from '../src/generator';
import { PRESETS } from '../src/presets';
import type { BuilderState } from '../src/types';

const sample: BuilderState = JSON.parse(readFileSync('scripts/sample-state.json', 'utf8'));
const OUT = 'out/validate';
rmSync(OUT, { recursive: true, force: true });

const cases: [string, BuilderState][] = PRESETS.map((p) => [
  p.key,
  { ...sample, language: p.language ?? 'en', preset: p.key, style: p.style, header: p.header, footer: p.footer, pages: p.pages },
]);
// Cover the header and footer variants each preset doesn't use, and an empty profile.
cases.push(['minimal-centered-split', { ...cases[0][1], header: 'centered', footer: 'split' }]);
// Nothing filled in: every optional section must hide itself and the theme must still be valid.
cases.push([
  'empty-profile',
  {
    ...cases[0][1],
    info: { ...cases[0][1].info, bio: '', email: '', location: '', university: '', skills: [], contributions: [], projects: [], experience: [], education: [], achievements: [], cvUrl: '', socials: {} },
  },
]);

let failed = 0;
for (const [label, state] of cases) {
  const { slug, files, assets } = generateTheme(state);
  const dir = join(OUT, label, slug);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  for (const a of assets) {
    mkdirSync(dirname(join(dir, a.path)), { recursive: true });
    if (a.data) writeFileSync(join(dir, a.path), Buffer.from(a.data.replace(/^data:[^,]*,/, ''), 'base64'));
    else copyFileSync(join('public', a.src!), join(dir, a.path));
  }
  try {
    const out = execFileSync('node', ['scripts/validate-theme.mjs'], { env: { ...process.env, THEME_DIR: dir }, encoding: 'utf8' });
    console.log(`✓ ${label}: ${out.trim().split('\n').pop()}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${label}\n${(e as { stdout?: string }).stdout ?? e}`);
  }
}
process.exitCode = failed ? 1 : 0;
