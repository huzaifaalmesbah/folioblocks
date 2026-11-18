/**
 * The app's own interface language (separate from the language of the
 * student's site). English is the source; other languages are dictionaries
 * keyed by the English text, from src/i18n/locales/ (see languages.ts),
 * applied in two ways:
 *
 * - `tr()` for strings built in code (messages with names or numbers in them).
 * - A DOM translator for everything else: it swaps the text of rendered
 *   nodes that match a dictionary key. Components stay plain English JSX,
 *   and anything without a translation simply stays English.
 *
 * Switching language remounts the app, so the DOM always starts in English.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { appDict, fill, isEnabled, SOURCE, type LangCode } from './languages';

export type UiLang = LangCode;

export const useUi = create<{ lang: UiLang; setLang: (lang: UiLang) => void }>()(
  persist((set) => ({ lang: SOURCE, setLang: (lang) => set({ lang }) }), {
    name: 'folioblocks-ui',
    // A language saved earlier may have been switched off since: fall back to English.
    merge: (saved, current) => {
      const lang = (saved as { lang?: unknown } | undefined)?.lang;
      return { ...current, lang: isEnabled(lang) ? lang : SOURCE };
    },
  }),
);

/** Translate a string built in code. `{name}` placeholders are filled from `vars` after translation. */
export function tr(text: string, vars: Record<string, string | number> = {}): string {
  return fill(appDict(useUi.getState().lang)[text] ?? text, vars);
}

const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'CODE', 'IFRAME']);
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];

function skipped(node: Node | null): boolean {
  for (let el = node instanceof Element ? node : (node?.parentElement ?? null); el; el = el.parentElement) {
    if (SKIP.has(el.tagName) || el.hasAttribute('data-no-translate')) return true;
  }
  return false;
}

/** Look a rendered text up by its trimmed, whitespace-collapsed form, keeping the spaces around it. */
export function translateText(dict: Record<string, string>, value: string): string | null {
  const key = value.replace(/\s+/g, ' ').trim();
  if (!key) return null;
  const hit = dict[key];
  if (hit === undefined || hit === key) return null;
  return value.match(/^\s*/)![0] + hit + value.match(/\s*$/)![0];
}

function translateNode(dict: Record<string, string>, node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (skipped(node)) return;
    const next = translateText(dict, node.nodeValue ?? '');
    if (next !== null) node.nodeValue = next;
    return;
  }
  if (!(node instanceof Element) || node.closest('[data-no-translate]')) return;
  for (const attr of ATTRS) {
    const v = node.getAttribute(attr);
    const next = v && translateText(dict, v);
    if (next) node.setAttribute(attr, next);
  }
  if (!SKIP.has(node.tagName)) node.childNodes.forEach((child) => translateNode(dict, child));
}

/** Translate `root` now and keep it translated as React updates it. Returns a stop function. */
export function startDomTranslator(root: Element, lang: UiLang): () => void {
  const dict = appDict(lang);
  if (lang === SOURCE) return () => {};
  translateNode(dict, root);
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList') r.addedNodes.forEach((n) => translateNode(dict, n));
      else translateNode(dict, r.target);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => observer.disconnect();
}
