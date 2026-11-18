import { REPO_URL } from '../config';
import { LangToggle } from '../i18n/LangToggle';

/** The pages that have their own menu entry, to mark the one you're on. */
export type SitePage = 'home' | 'guide' | 'translate';

/**
 * The site header for every page but the builder: logo, links, and on the
 * right the language menu (when there is more than one language) and
 * Start building. "Templates" and "AI agent" are home page sections; from
 * another page they open the home page there.
 */
export function SiteHeader({ current = 'home' }: { current?: SitePage }) {
  const link = (page: SitePage) =>
    current === page ? { 'aria-current': 'page' as const, className: 'font-medium text-slate-900' } : { className: 'hover:text-slate-900' };
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6" aria-label="Main">
        <a href="#/" className="flex items-center gap-2 font-bold">
          <span aria-hidden className="grid h-7 w-7 grid-cols-2 gap-0.5 rounded-md bg-blue-700 p-1">
            <span className="rounded-sm bg-white" />
            <span className="rounded-sm bg-white/60" />
            <span className="rounded-sm bg-white/60" />
            <span className="rounded-sm bg-white" />
          </span>
          FolioBlocks
        </a>
        <div className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          <a href="#designs" className="hover:text-slate-900">Templates</a>
          <a href="#ai" className="hover:text-slate-900">AI agent</a>
          <a href="#/guide" {...link('guide')}>Guide</a>
          <a href="#/translate" {...link('translate')}>Translate</a>
          <a href={REPO_URL} className="hover:text-slate-900">GitHub</a>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <LangToggle />
          <a href="#/build" className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Start building
          </a>
        </div>
      </nav>
    </header>
  );
}

/** The site footer for every page but the builder. */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 py-8 text-sm text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
        <span>FolioBlocks · GPL-2.0-or-later</span>
        <nav aria-label="Footer" className="flex gap-5 sm:ml-auto">
          <a className="hover:text-slate-700" href="#/guide">Guide</a>
          <a className="hover:text-slate-700" href="#/translate">Help translate</a>
          <a className="hover:text-slate-700" href={REPO_URL}>GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
