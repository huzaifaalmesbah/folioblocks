/**
 * The theme's own words (headings, buttons, menu, alt text) in the site's
 * language. The translations live in `src/i18n/locales/<code>.json` under
 * `theme`, keyed by the English text. Whatever the student types is used
 * exactly as written. Strings still go through __() in the theme, so
 * translators can change them later in WordPress.
 */
import { fill, themeDict, type LangCode } from '../i18n/languages';

/** Set by `npm run i18n:extract` to collect every English string the theme uses. */
let collector: Set<string> | null = null;

export function collectThemeStrings(into: Set<string> | null): void {
  collector = into;
}

export function tr(lang: LangCode | undefined, text: string): string {
  collector?.add(text);
  return themeDict(lang)[text] ?? text;
}

/** A translated string with `{name}` placeholders filled in after translation. */
function trf(lang: LangCode | undefined, text: string, vars: Record<string, string>): string {
  return fill(tr(lang, text), vars);
}

export function portraitAlt(lang: LangCode | undefined, name: string): string {
  return trf(lang, 'Portrait of {name}', { name });
}

export function screenshotAlt(lang: LangCode | undefined, title: string): string {
  return trf(lang, 'Screenshot of {title}', { title });
}

export function footerCredit(lang: LangCode | undefined, toolUrl: string): string {
  return trf(lang, 'Built with <a href="https://wordpress.org">WordPress</a> · Theme made with <a href="{url}">FolioBlocks</a>', { url: toolUrl });
}
