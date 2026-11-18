/**
 * Start a new language: copy en/ to <code>/ with a language.json to fill in.
 * Every string starts as English; translate the right-hand side.
 *
 * Usage: npm run i18n:new -- <code> "<name in the language>" "<English name>" [rtl]
 * e.g.   npm run i18n:new -- hi "हिन्दी" "Hindi"
 *        npm run i18n:new -- ar "العربية" "Arabic" rtl
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [code, name, englishName, dir = 'ltr'] = process.argv.slice(2);
if (!code || !name || !englishName || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(code) || !['ltr', 'rtl'].includes(dir)) {
  console.error('Usage: npm run i18n:new -- <code> "<name in the language>" "<English name>" [rtl]\ne.g.   npm run i18n:new -- hi "हिन्दी" "Hindi"');
  process.exit(1);
}
const folder = join('src/i18n/locales', code);
if (existsSync(folder)) {
  console.error(`${folder} already exists.`);
  process.exit(1);
}
mkdirSync(folder, { recursive: true });
writeFileSync(join(folder, 'language.json'), `${JSON.stringify({ code, name, englishName, dir, enabled: false }, null, 2)}\n`);
for (const part of ['home', 'builder', 'templates', 'theme']) copyFileSync(join('src/i18n/locales/en', `${part}.json`), join(folder, `${part}.json`));
// Load the new folder in the app.
execFileSync('npx', ['tsx', 'scripts/i18n-extract.ts'], { stdio: 'inherit' });
console.log(`\nCreated ${folder}. Translate the right-hand side of each file, then open a pull request. See TRANSLATING.md.`);
