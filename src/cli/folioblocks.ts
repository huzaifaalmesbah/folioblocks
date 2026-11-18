/**
 * folioblocks: the FolioBlocks builder for the command line, made for AI
 * agents following the folioblocks skill (skills/folioblocks/SKILL.md).
 *
 * The project file is the builder's backup file (folioblocks.json): the
 * same file opens in the website builder with ⋯ → Open a backup file, so a
 * student can start with an agent and finish in the browser, or the other
 * way round. Themes come from the same generator as the website.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { publishChecklist } from '../checklist';
import { SITE_URL } from '../config';
import { defaultState } from '../defaults';
import { FONT_PAIRS, FONTS } from '../fonts';
import { generateTheme } from '../generator';
import { LOOKS } from '../generator/looks';
import { SECTION_LABELS, SECTIONS } from '../generator/sections';
import { buildBlueprint, playgroundUrl } from '../playground/blueprint';
import { enabledLanguages } from '../i18n/languages';
import { PALETTES, PRESETS, presetByKey } from '../presets';
import type { BuilderState } from '../types';
import { buildTheme, builderLink, CliError, emptyInfo, loadProject, openerPage, publicDir, saveProject, withTemplate } from './project';

const HELP = `folioblocks: make a WordPress portfolio block theme from a folioblocks.json file.

Usage: folioblocks <command> [file] [options]

  templates                 Templates, sections, colours, fonts and section styles, as JSON
  init [file] --template <key>
                            Start a project file from a template (default: folioblocks.json)
  template <key> [file]     Switch the template; the info in the file stays
  check [file]              What a visitor would notice, before building
  build [file] [--out dir]  Write the theme folder and its zip (default out: ./theme)
  link [file]               A link (and theme/open-in-builder.html) that opens the website builder with this file loaded
  preview [file]            Run the theme in a local WordPress (Playground CLI, needs Node.js)
  preview --url [file]      Write theme/open-preview.html, which opens it on playground.wordpress.net

Photos: in the file, "avatar" and project "image" may be paths to local
.jpg, .png or .webp files (relative to the file); they are embedded.
`;

const args = process.argv.slice(2);
const [command] = args;
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.slice(1).filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
const fileArg = (n = 0) => resolve(positional[n] ?? 'folioblocks.json');


function printChecklist(state: BuilderState): number {
  const items = publishChecklist(state);
  const fixes = items.filter((i) => i.level === 'fix');
  for (const i of fixes) console.log(`FIX  ${i.text}`);
  for (const i of items.filter((x) => x.level === 'tip')) console.log(`TIP  ${i.text}`);
  if (!items.length) console.log('Nothing a visitor would trip over.');
  return fixes.length;
}

async function main() {
  switch (command) {
    case 'templates': {
      console.log(
        JSON.stringify(
          {
            templates: PRESETS.map((p) => ({
              key: p.key,
              name: p.label,
              bestFor: p.bestFor,
              tracks: p.tracks,
              description: p.description,
              preview: `${SITE_URL}#template-${p.key}`,
            })),
            // The theme's own words (headings, buttons, menu) can be in these languages; others stay English.
            languages: enabledLanguages().map((l) => ({ code: l.code, name: l.englishName, font: l.font ?? null })),
            // Fonts for writing systems that need their own (set as both heading and body when the site is in that language).
            scriptFonts: { bengali: 'noto-sans-bengali' },
            sections: Object.fromEntries(
              Object.entries(SECTIONS).map(([type, variants]) => [type, { label: SECTION_LABELS[type as keyof typeof SECTION_LABELS], variants: Object.fromEntries(Object.entries(variants).map(([k, v]) => [k, v.label])) }]),
            ),
            palettes: PALETTES.map((p) => ({ key: p.key, name: p.label, palette: p.palette })),
            fontPairs: FONT_PAIRS.map((f) => ({ name: f.label, heading: f.heading, body: f.body })),
            fonts: Object.keys(FONTS),
            sectionStyles: Object.fromEntries(Object.entries(LOOKS).map(([k, l]) => [k, `${l.label}: ${l.description}`])),
            radius: ['none', 'sm', 'md', 'lg'],
          },
          null,
          2,
        ),
      );
      return;
    }
    case 'init': {
      const file = fileArg();
      if (existsSync(file) && !args.includes('--force')) throw new CliError(`${basename(file)} already exists. Use "folioblocks template <key>" to switch templates, or --force to start over.`);
      // Start empty: nothing the person didn't say should reach their site.
      saveProject(file, withTemplate({ ...structuredClone(defaultState), info: emptyInfo() }, flag('template') ?? 'minimal'));
      console.log(`Created ${basename(file)}. Fill in "state.info", then: folioblocks check`);
      return;
    }
    case 'template': {
      const key = positional[0];
      if (!key) throw new CliError('which template? See: folioblocks templates');
      const file = fileArg(1);
      saveProject(file, withTemplate(loadProject(file), key));
      console.log(`${basename(file)} now uses ${presetByKey(key).label}. Your info stays.`);
      return;
    }
    case 'check': {
      const fixes = printChecklist(loadProject(fileArg()));
      process.exitCode = fixes ? 2 : 0;
      return;
    }
    case 'build': {
      const state = loadProject(fileArg());
      const { dir, zip } = await buildTheme(state, resolve(flag('out') ?? 'theme'));
      printChecklist(state);
      console.log(`\nTheme folder: ${dir}\nZip to upload: ${zip}`);
      return;
    }
    case 'link': {
      const url = builderLink(loadProject(fileArg()));
      const page = join(resolve(flag('out') ?? 'theme'), 'open-in-builder.html');
      mkdirSync(dirname(page), { recursive: true });
      writeFileSync(page, openerPage(url, 'Opening your project in the FolioBlocks builder…'));
      console.log(`${url}\n\nOr open this file in a browser (double-click it): ${page}`);
      return;
    }
    case 'preview': {
      const state = loadProject(fileArg());
      const { slug, files, assets } = generateTheme(state);
      const bp = join(resolve(flag('out') ?? 'theme'), 'blueprint.json');
      mkdirSync(dirname(bp), { recursive: true });
      writeFileSync(bp, JSON.stringify(buildBlueprint(state, slug, files, assets), null, 2));
      if (args.includes('--url')) {
        // The link carries the whole theme, far too long to paste: put it in a page to double-click.
        const page = join(dirname(bp), 'open-preview.html');
        writeFileSync(page, openerPage(playgroundUrl(buildBlueprint(state, slug, files, assets)), 'Opening your site in WordPress Playground…'));
        console.log(`Open this file in a browser (double-click it) to see your site in WordPress Playground: ${page}`);
        return;
      }
      console.log('Starting WordPress Playground (the first run downloads it)…');
      const port = flag('port') ?? '9400';
      const child = spawn('npx', ['-y', '@wp-playground/cli@latest', 'server', `--port=${port}`, `--blueprint=${bp}`], { stdio: 'inherit' });
      child.on('exit', (code) => process.exit(code ?? 0));
      return;
    }
    case 'version': {
      console.log(JSON.parse(readFileSync(join(publicDir(), '..', 'package.json'), 'utf8')).version);
      return;
    }
    default:
      console.log(HELP);
      if (command && command !== 'help' && command !== '--help') process.exitCode = 1;
  }
}

try {
  await main();
} catch (e) {
  if (!(e instanceof CliError)) throw e;
  console.error(`folioblocks: ${e.message}`);
  process.exit(1);
}
