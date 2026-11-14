/**
 * Write a generated theme to disk, for testing it in a real WordPress.
 * Usage: npm run export -- [outDir] [stateJsonFile]
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defaultState } from '../src/defaults';
import { generateTheme } from '../src/generator';
import type { BuilderState } from '../src/types';

const outDir = process.argv[2] ?? 'out';
const stateFile = process.argv[3];
const state: BuilderState = stateFile ? JSON.parse(readFileSync(stateFile, 'utf8')) : defaultState;

const { slug, files, assets } = generateTheme(state);
for (const [path, content] of Object.entries(files)) {
  const full = join(outDir, slug, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
for (const path of assets) {
  const full = join(outDir, slug, path);
  mkdirSync(dirname(full), { recursive: true });
  copyFileSync(join('public', path.replace(/^assets\//, '')), full);
}
console.log(join(outDir, slug));
