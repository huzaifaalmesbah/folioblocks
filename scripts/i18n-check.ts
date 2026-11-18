/**
 * Check every language folder in src/i18n/locales/ and print how much of
 * each is translated. It reads the folders straight from disk, so a new
 * language uploaded through GitHub is checked before anything else runs.
 *
 * Errors (the check fails): broken JSON, a language.json that is missing a
 * field or names another folder, a translation that drops or renames a
 * {placeholder}, or that loses a link or other HTML tag.
 * Notes (the check passes): strings English no longer has. They are
 * removed automatically by `npm run i18n:extract`.
 *
 * Usage: npm run i18n:check
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FONT_KEYS } from '../src/fonts';

const LOCALES = 'src/i18n/locales';
const PARTS = ['home', 'builder', 'templates', 'theme'];

const errors: string[] = [];
const notes: string[] = [];

function readJson(path: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(readFileSync(path, 'utf8'));
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    errors.push(`${path}: must be a JSON object { … }.`);
  } catch (e) {
    errors.push(`${path}: not valid JSON (${(e as Error).message}). A missing comma or quote is the usual cause.`);
  }
  return null;
}

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(' ');
const tags = (s: string) => (s.match(/<\/?[a-z][^>]*>/gi) ?? []).map((t) => t.replace(/\s.*?(\/?)>$/, '$1>').toLowerCase()).sort().join(' ');

const english: Record<string, Record<string, string>> = {};
for (const part of PARTS) english[part] = (readJson(join(LOCALES, 'en', `${part}.json`)) ?? {}) as Record<string, string>;

const rows: string[][] = [];
const codes = readdirSync(LOCALES).filter((f) => statSync(join(LOCALES, f)).isDirectory() && f !== 'en').sort();

for (const code of codes) {
  const dir = join(LOCALES, code);
  const meta = readJson(join(dir, 'language.json'));
  if (meta) {
    if (meta.code !== code) errors.push(`${dir}/language.json: "code" is "${meta.code}" but the folder is "${code}". They must match.`);
    for (const field of ['name', 'englishName']) {
      if (typeof meta[field] !== 'string' || !(meta[field] as string).trim()) errors.push(`${dir}/language.json: "${field}" is missing.`);
    }
    if (meta.dir !== 'ltr' && meta.dir !== 'rtl') errors.push(`${dir}/language.json: "dir" must be "ltr" (left to right) or "rtl" (right to left).`);
    if (typeof meta.enabled !== 'boolean') errors.push(`${dir}/language.json: "enabled" must be true or false.`);
    if (meta.font !== undefined && !FONT_KEYS.includes(meta.font as never)) errors.push(`${dir}/language.json: font "${meta.font}" is not one of ${FONT_KEYS.join(', ')}.`);
  }

  const row = [code, String(meta?.englishName ?? '?'), meta?.enabled ? 'on' : 'off'];
  let done = 0;
  let total = 0;
  for (const part of PARTS) {
    const path = join(dir, `${part}.json`);
    const source = english[part];
    const count = Object.keys(source).length;
    total += count;
    if (!existsSync(path)) {
      row.push(`0/${count}`);
      continue;
    }
    const mine = readJson(path) ?? {};
    let n = 0;
    for (const [key, value] of Object.entries(mine)) {
      if (typeof value !== 'string') {
        errors.push(`${path}: the translation of "${key}" must be text in quotes.`);
        continue;
      }
      if (!(key in source)) {
        notes.push(`${path}: "${key}" is no longer used in English; it will be removed.`);
        continue;
      }
      if (!value || value === key) continue;
      n++;
      if (placeholders(value) !== placeholders(key)) {
        errors.push(`${path}: "${key}" must keep ${placeholders(key) || 'no placeholders'} exactly (found: ${placeholders(value) || 'none'}).`);
      }
      if (tags(value) !== tags(key)) {
        errors.push(`${path}: "${key}" must keep the same links/HTML tags as the English.`);
      }
    }
    done += n;
    row.push(`${n}/${count}`);
  }
  row.push(`${total ? Math.floor((done / total) * 100) : 0}%`);
  rows.push(row);
}

const head = ['code', 'language', 'enabled', ...PARTS, 'total'];
const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
const line = (r: string[]) => r.map((c, i) => c.padEnd(widths[i])).join('  ');
console.log(line(head));
for (const r of rows) console.log(line(r));
if (!rows.length) console.log('(no translations yet)');

for (const n of notes) console.log(`note: ${n}`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) to fix:`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('\nAll translations are valid.');
