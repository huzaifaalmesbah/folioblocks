/**
 * The command line's work, kept apart from its argument parsing so it can
 * be tested: reading a project file (folioblocks.json, the builder's backup
 * format), switching templates, building the theme, and making a link that
 * opens the website builder with the project loaded.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { SITE_URL } from '../config';
import { generateTheme } from '../generator';
import { exportSettings, parseSettings } from '../layout';
import { PRESETS } from '../presets';
import type { BuilderState, Info } from '../types';
import { screenshotPng } from './png';

/** A problem to show the person as it is, without a stack trace. */
export class CliError extends Error {}

/** The bundled fonts and sample images, wherever this runs from (the repo, or the bundled cli/). */
export function publicDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, 'public', 'fonts'))) return join(dir, 'public');
    dir = dirname(dir);
  }
  throw new CliError('could not find the bundled fonts and images (public/).');
}

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const MAX_PHOTO = 2_000_000;

/** A local photo path becomes a data URL, as the builder stores photos. */
function embed(value: string | undefined, base: string): string | undefined {
  if (!value || value.startsWith('data:')) return value;
  const path = resolve(base, value);
  const type = MIME[extname(path).toLowerCase()];
  if (!type) throw new CliError(`"${value}" is not a .jpg, .png or .webp photo.`);
  if (!existsSync(path)) throw new CliError(`photo not found: ${value}`);
  const bytes = readFileSync(path);
  if (bytes.length > MAX_PHOTO) throw new CliError(`"${value}" is over 2 MB. Use a smaller photo (about 1200 px wide is plenty).`);
  return `data:${type};base64,${bytes.toString('base64')}`;
}

/** Read and validate a project file, embedding local photos. */
export function loadProject(file: string): BuilderState {
  if (!existsSync(file)) throw new CliError(`${basename(file)} not found. Start one with: folioblocks init --template <key>`);
  let raw: { state?: { info?: Partial<Info> } };
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new CliError(`${basename(file)} is not valid JSON. A missing comma or quote is the usual cause.`);
  }
  const info = raw.state?.info;
  if (info) {
    const base = dirname(file);
    info.avatar = embed(info.avatar, base);
    info.projects = (info.projects ?? []).map((p) => ({ ...p, image: embed(p.image, base) }));
  }
  try {
    return parseSettings(JSON.stringify(raw)).state;
  } catch (e) {
    throw new CliError((e as Error).message);
  }
}

export function saveProject(file: string, state: BuilderState): void {
  writeFileSync(file, exportSettings(state, []));
}

/** Apply a template's design; the info stays. */
export function withTemplate(state: BuilderState, key: string): BuilderState {
  const p = PRESETS.find((x) => x.key === key);
  if (!p) throw new CliError(`unknown template "${key}". See: folioblocks templates`);
  return { ...state, preset: p.key, style: structuredClone(p.style), header: p.header, footer: p.footer, pages: structuredClone(p.pages) };
}

/** Every file of the theme, text and binary, by path inside the theme folder. */
export function themeFiles(state: BuilderState): { slug: string; files: Record<string, string | Uint8Array> } {
  const { slug, files, assets } = generateTheme(state);
  const pub = publicDir();
  const out: Record<string, string | Uint8Array> = { ...files, 'screenshot.png': screenshotPng(state.style.palette) };
  for (const a of assets) {
    out[a.path] = a.data ? Buffer.from(a.data.replace(/^data:[^,]*,/, ''), 'base64') : readFileSync(join(pub, a.src!));
  }
  return { slug, files: out };
}

/** Write the theme folder and its zip (the folder at the zip's root, as WordPress expects). */
export async function buildTheme(state: BuilderState, out: string): Promise<{ dir: string; zip: string }> {
  const { slug, files } = themeFiles(state);
  const dir = join(out, slug);
  const zip = new JSZip();
  const root = zip.folder(slug)!;
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
    root.file(path, content);
  }
  const zipPath = join(out, `${slug}.zip`);
  writeFileSync(zipPath, await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' }));
  return { dir, zip: zipPath };
}

/** A link that opens the website builder with this project loaded (photos left out: links must stay short). */
export function builderLink(state: BuilderState, site = SITE_URL): string {
  const light: BuilderState = {
    ...state,
    info: { ...state.info, avatar: '', projects: state.info.projects.map(({ image: _image, ...p }) => p) },
  };
  const json = JSON.stringify(JSON.parse(exportSettings(light, [])));
  return `${site}#/build?import=${Buffer.from(json, 'utf8').toString('base64url')}`;
}
