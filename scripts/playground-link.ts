/**
 * Print a WordPress Playground link for a theme state.
 * Usage: npm run link -- [stateJsonFile]
 */
import { readFileSync } from 'node:fs';
import { defaultState } from '../src/defaults';
import { generateTheme } from '../src/generator';
import { buildBlueprint, playgroundUrl } from '../src/playground/blueprint';
import type { BuilderState } from '../src/types';

const stateFile = process.argv[2];
const state: BuilderState = stateFile ? JSON.parse(readFileSync(stateFile, 'utf8')) : defaultState;
const { slug, files } = generateTheme(state);
console.log(playgroundUrl(buildBlueprint(state, slug, files)));
