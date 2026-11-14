import { useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeAsset } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';
import { SAMPLE_POST_IMAGES } from '../generator/images';
import { assetUrl, publicUrl } from '../zip/assets';
import { BLOCK_LIBRARY_CSS, themeCss } from './css';
import { patternMap, renderPage, type PreviewPage } from './render';

/** The iframe's starting document. Content and styles are swapped in place afterwards. */
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${BLOCK_LIBRARY_CSS}">
<style id="theme"></style><style id="layout"></style>
</head><body><div class="wp-site-blocks" id="root"></div></body></html>`;

/**
 * Renders the theme in the browser, instantly and in any browser, with no
 * WordPress. A close approximation; "Open in WordPress Playground" shows
 * the real site.
 */
export function QuickPreview(props: { state: BuilderState; files: ThemeFiles; assets: ThemeAsset[] }) {
  const { state, files, assets } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<PreviewPage>('home');

  // Theme files (fonts, images) load from the app or from the student's data URLs.
  const fileUrl = useMemo(() => {
    const byPath = new Map(assets.map((a) => [a.path, assetUrl(a)]));
    return (path: string) => byPath.get(path) ?? '';
  }, [assets]);
  const patterns = useMemo(() => patternMap(files, fileUrl), [files, fileUrl]);
  const rendered = useMemo(
    () => renderPage(state, files, page, { patterns, fileUrl, sampleImage: (i) => publicUrl(SAMPLE_POST_IMAGES[i]) }),
    [state, files, page, patterns, fileUrl],
  );
  const css = useMemo(() => themeCss(files['theme.json'], fileUrl), [files, fileUrl]);

  // Swap content in place so the scroll position survives each edit.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!ready || !doc) return;
    doc.getElementById('theme')!.textContent = css;
    doc.getElementById('layout')!.textContent = rendered.css;
    doc.getElementById('root')!.innerHTML = rendered.html;
  }, [ready, css, rendered]);

  // Links in the preview switch pages; everything else stays put.
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!ready || !doc) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a');
      if (!link) return;
      const target = link.getAttribute('data-preview-page') as PreviewPage | null;
      if (target) {
        e.preventDefault();
        setPage(target);
        doc.defaultView?.scrollTo(0, 0);
      } else if (!link.getAttribute('target')) {
        e.preventDefault();
      }
    };
    doc.addEventListener('click', onClick);
    return () => doc.removeEventListener('click', onClick);
  }, [ready]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Links inside the preview (menu, post titles) switch pages. */}
      <div className="flex min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          title="Quick preview of your theme"
          srcDoc={SHELL}
          onLoad={() => setReady(true)}
          className="h-full min-h-[60vh] w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
