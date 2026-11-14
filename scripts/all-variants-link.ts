/**
 * Print a Playground link whose home page shows every section variant once,
 * to check them all in the Site Editor in one go.
 * Usage: npx tsx scripts/all-variants-link.ts
 */
import { readFileSync } from 'node:fs';
import { generateTheme } from '../src/generator';
import { SECTIONS } from '../src/generator/sections';
import { buildBlueprint, playgroundUrl } from '../src/playground/blueprint';
import type { BuilderState, Section, SectionType } from '../src/types';

const state: BuilderState = JSON.parse(readFileSync('scripts/sample-state.json', 'utf8'));
let n = 0;
const all: Section[] = Object.entries(SECTIONS).flatMap(([type, variants]) =>
  Object.keys(variants).map((variant) => ({ id: `v${++n}`, type: type as SectionType, variant })),
);
state.pages.home = all;
const { slug, files, assets } = generateTheme(state);
console.log(playgroundUrl(buildBlueprint(state, slug, files, assets)));
