import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { languageMeta } from './i18n/languages';
import { startDomTranslator, tr, useUi } from './i18n/ui';
import { Landing } from './landing/Landing';

// The builder (generator, zip, drag-and-drop) loads only when it is opened, so the home page stays light.
const Builder = lazy(() => import('./Builder').then((m) => ({ default: m.Builder })));

/**
 * Two views on one static page (GitHub Pages has no server routing):
 * `#/build` is the builder; anything else is the home page, whose own
 * section links (#ai, #wordpress-com) scroll within it.
 */
function isBuilder(): boolean {
  return window.location.hash.startsWith('#/build');
}

export default function App() {
  const [builder, setBuilder] = useState(isBuilder);

  useEffect(() => {
    const onHash = () => {
      const next = isBuilder();
      setBuilder((was) => {
        if (was !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const lang = useUi((s) => s.lang);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = builder ? tr('Build your theme · FolioBlocks') : tr('FolioBlocks: build your WordPress portfolio theme');
    document.documentElement.lang = lang;
    document.documentElement.dir = languageMeta(lang).dir;
  }, [builder, lang]);

  // Translate before the first paint, and keep translating as the page changes.
  useLayoutEffect(() => (rootRef.current ? startDomTranslator(rootRef.current, lang) : undefined), [lang]);

  // key={lang}: switching language remounts the page, so it is always translated from English.
  return (
    <div ref={rootRef} key={lang}>
      {builder ? (
        <Suspense fallback={<p className="p-8 text-slate-600">Loading the builder…</p>}>
          <Builder />
        </Suspense>
      ) : (
        <Landing />
      )}
    </div>
  );
}
