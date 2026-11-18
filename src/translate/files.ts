/**
 * The translate page's files: drafts saved in this browser, and the
 * language folder it downloads and reads back.
 */
import JSZip from 'jszip';
import { ALL_PARTS, localeFiles, SOURCE, type LanguageMeta, type Part } from '../i18n/languages';

export type Files = Record<Part, Record<string, string>>;
export type Draft = { meta: LanguageMeta; files: Files };

const ENGLISH = localeFiles(SOURCE)!;
export const englishOf = (part: Part) => ENGLISH[part] ?? {};
const storageKey = (code: string) => `folioblocks-translate-${code}`;
export const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(' ');

export function emptyFiles(): Files {
  return { home: {}, builder: {}, templates: {}, theme: {} };
}

/** What is already in the repository for a language, plus what this browser saved. */
export function loadDraft(meta: LanguageMeta): Draft {
  const files = emptyFiles();
  const repo = localeFiles(meta.code);
  for (const part of ALL_PARTS) {
    for (const [k, v] of Object.entries(repo?.[part] ?? {})) if (v && v !== k) files[part][k] = v;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(meta.code)) ?? 'null') as Draft | null;
    if (saved?.files) {
      for (const part of ALL_PARTS) Object.assign(files[part], saved.files[part] ?? {});
      return { meta: { ...meta, ...saved.meta, code: meta.code }, files };
    }
  } catch {
    // Storage blocked or unreadable: start from the repository's files.
  }
  return { meta, files };
}

export function save(draft: Draft) {
  try {
    localStorage.setItem(storageKey(draft.meta.code), JSON.stringify(draft));
  } catch {
    // Private window or full storage: the download still works.
  }
}

/** The language's folder as the repository keeps it: every English string, translated or not. */
export function folderFiles(draft: Draft): Record<string, string> {
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  const out: Record<string, string> = { 'language.json': json(draft.meta) };
  for (const part of ALL_PARTS) {
    out[`${part}.json`] = json(Object.fromEntries(Object.keys(englishOf(part)).map((k) => [k, draft.files[part][k] || k])));
  }
  return out;
}

export async function readUpload(file: File, into: Draft): Promise<Draft> {
  const next: Draft = { meta: { ...into.meta }, files: { ...into.files } };
  const apply = (name: string, text: string) => {
    const base = name.split('/').pop()!.replace(/\.json$/, '');
    const data = JSON.parse(text) as Record<string, unknown>;
    if (base === 'language') next.meta = { ...next.meta, ...(data as Partial<LanguageMeta>), code: into.meta.code };
    else if ((ALL_PARTS as readonly string[]).includes(base)) {
      const part = base as Part;
      const kept: Record<string, string> = { ...next.files[part] };
      for (const [k, v] of Object.entries(data)) if (typeof v === 'string' && v && v !== k && k in englishOf(part)) kept[k] = v;
      next.files[part] = kept;
    }
  };
  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    for (const entry of Object.values(zip.files)) if (!entry.dir && entry.name.endsWith('.json')) apply(entry.name, await entry.async('string'));
  } else {
    apply(file.name, await file.text());
  }
  return next;
}
