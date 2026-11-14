import { useEffect, useState } from 'react';
import { Builder } from './Builder';
import { Landing } from './landing/Landing';

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

  useEffect(() => {
    document.title = builder ? 'Build your theme · FolioBlocks' : 'FolioBlocks: build your WordPress portfolio theme';
  }, [builder]);

  return builder ? <Builder /> : <Landing />;
}
