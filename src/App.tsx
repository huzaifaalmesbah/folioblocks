import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { languageMeta } from './i18n/languages';
import { startDomTranslator, tr, useUi } from './i18n/ui';
import { Landing } from './landing/Landing';
import { useBuilder } from './store';
import { ConfirmHost } from './ui/ConfirmDialog';

// The builder (generator, zip, drag-and-drop) loads only when it is opened, so the home page stays light.
const Builder = lazy(() => import('./Builder').then((m) => ({ default: m.Builder })));
const GuidePage = lazy(() => import('./guide/GuidePage').then((m) => ({ default: m.GuidePage })));
const TranslatePage = lazy(() => import('./translate/TranslatePage').then((m) => ({ default: m.TranslatePage })));

/**
 * Views on one static page (GitHub Pages has no server routing): `#/build`
 * is the builder, `#/guide` the publishing guide, `#/translate` the
 * translation page; anything else is the home page, whose own section
 * links (#ai, #publish) scroll within it.
 */
type View = 'home' | 'builder' | 'guide' | 'translate';
function currentView(): View {
  const h = window.location.hash;
  if (h.startsWith('#/build')) return 'builder';
  if (h.startsWith('#/guide')) return 'guide';
  if (h.startsWith('#/translate')) return 'translate';
  return 'home';
}

export default function App() {
  const [view, setView] = useState(currentView);
  const builder = view === 'builder';

  useEffect(() => {
    const onHash = () => {
      const next = currentView();
      setView((was) => {
        if (was !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const lang = useUi((s) => s.lang);

  // The saved draft loads asynchronously (photos come from IndexedDB): wait for it, so nothing shows defaults first or overwrites it.
  const hydrated = useSyncExternalStore(
    (onChange) => useBuilder.persist.onFinishHydration(onChange),
    () => useBuilder.persist.hasHydrated(),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title =
      view === 'builder'
        ? tr('Build your theme · FolioBlocks')
        : view === 'translate'
          ? tr('Help translate · FolioBlocks')
          : view === 'guide'
            ? tr('Publish your site · FolioBlocks')
          : tr('FolioBlocks: build your WordPress portfolio theme');
    document.documentElement.lang = lang;
    document.documentElement.dir = languageMeta(lang).dir;
  }, [view, lang]);

  // Translate before the first paint, and keep translating as the page changes.
  useLayoutEffect(() => (rootRef.current ? startDomTranslator(rootRef.current, lang) : undefined), [lang]);

  if (!hydrated) return <p className="p-8 text-slate-600">Loading…</p>;

  // key={lang}: switching language remounts the page, so it is always translated from English.
  return (
    <div ref={rootRef} key={lang}>
      {builder ? (
        <Suspense fallback={<p className="p-8 text-slate-600">Loading the builder…</p>}>
          <Builder />
        </Suspense>
      ) : view === 'guide' ? (
        <Suspense fallback={<p className="p-8 text-slate-600">Loading…</p>}>
          <GuidePage />
        </Suspense>
      ) : view === 'translate' ? (
        <Suspense fallback={<p className="p-8 text-slate-600">Loading…</p>}>
          <TranslatePage />
        </Suspense>
      ) : (
        <Landing />
      )}
      <ConfirmHost />
    </div>
  );
}
