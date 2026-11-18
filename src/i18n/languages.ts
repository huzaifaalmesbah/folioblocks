/**
 * Languages: one folder per language in `src/i18n/locales/`, each with the
 * same small files:
 *
 * - `language.json`: its name, writing direction, font, and `enabled`.
 * - `home.json`, `builder.json`, `templates.json`: the app's interface.
 * - `theme.json`: the words the generated theme writes itself.
 *
 * `en/` is the source, generated from the code by `npm run i18n:extract`;
 * nobody edits it by hand. Every other folder is a copy of it with the
 * right-hand side translated. A string left in English (or empty), or a
 * file that is missing, simply shows in English. A language shows in the
 * app only when its language.json says `"enabled": true`. See TRANSLATING.md.
 */
import { LOCALE_FILES } from './locales';

export type LangCode = string;

export type LanguageMeta = {
  /** BCP 47 code, e.g. "bn", "pt-BR". */
  code: LangCode;
  /** The language's name in itself, e.g. "বাংলা". */
  name: string;
  /** The name in English, e.g. "Bengali". */
  englishName: string;
  /** Writing direction. */
  dir: 'ltr' | 'rtl';
  /** A bundled font key for scripts that system fonts may not cover (see src/fonts.ts). */
  font?: string;
  /** Shown in the app's language menus. Maintainers switch this on when a translation is ready. */
  enabled: boolean;
};

type Dict = Record<string, string>;

/** One language's folder. Every file but language.json may be missing. */
export type LocaleFiles = {
  language: LanguageMeta;
  home?: Dict;
  builder?: Dict;
  templates?: Dict;
  theme?: Dict;
};

/** The interface's files, in the order the translate page lists them. */
export const APP_PARTS = ['home', 'builder', 'templates'] as const;
export const ALL_PARTS = [...APP_PARTS, 'theme'] as const;
export type Part = (typeof ALL_PARTS)[number];

const FILES = LOCALE_FILES as Record<string, LocaleFiles>;

/** A language's files as they are in the repository (for the translate page). */
export function localeFiles(code: LangCode): LocaleFiles | undefined {
  return FILES[code];
}

export const SOURCE: LangCode = 'en';

/** Every language that has a file, enabled or not (for the translate page and checks). */
export function allLanguages(): LanguageMeta[] {
  return Object.values(FILES)
    .map((f) => f.language)
    .sort((a, b) => (a.code === SOURCE ? -1 : b.code === SOURCE ? 1 : a.englishName.localeCompare(b.englishName)));
}

/** Languages shown in the app: English first, then every enabled translation. */
export function enabledLanguages(): LanguageMeta[] {
  return allLanguages().filter((l) => l.code === SOURCE || l.enabled);
}

export function languageMeta(code: LangCode | undefined): LanguageMeta {
  return (code && FILES[code]?.language) || FILES[SOURCE].language;
}

/** Whether `code` is a language the app can use: English, or an enabled translation. */
export function isEnabled(code: unknown): code is LangCode {
  return typeof code === 'string' && enabledLanguages().some((l) => l.code === code);
}

/** A translation that is still the English text, or empty, counts as missing. */
function translated(dict: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dict ?? {})) if (v && v !== k) out[k] = v;
  return out;
}

const appCache = new Map<string, Record<string, string>>();
const themeCache = new Map<string, Record<string, string>>();

/** The interface dictionary for a language: English text → translation. */
export function appDict(code: LangCode | undefined): Record<string, string> {
  const c = code ?? SOURCE;
  if (!appCache.has(c)) {
    const f = FILES[c];
    appCache.set(c, c === SOURCE ? {} : translated({ ...f?.home, ...f?.builder, ...f?.templates }));
  }
  return appCache.get(c)!;
}

/** The theme's own words for a language: English text → translation. */
export function themeDict(code: LangCode | undefined): Record<string, string> {
  const c = code ?? SOURCE;
  if (!themeCache.has(c)) themeCache.set(c, c === SOURCE ? {} : translated(FILES[c]?.theme));
  return themeCache.get(c)!;
}

/** Fill `{name}` placeholders. */
export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
