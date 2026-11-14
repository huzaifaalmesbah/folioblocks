import { useEffect, useMemo, useRef, useState } from 'react';
import type { ThemeAsset } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';
import { publicUrl } from '../zip/assets';
import { BLOCK_LIBRARY_CSS, themeCss } from './css';
import { patternMap, PREVIEW_PAGES, renderPage, type PreviewPage } from './render';

type Device = 'desktop' | 'tablet' | 'mobile';
const WIDTHS: Record<Device, string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

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
  const [device, setDevice] = useState<Device>('desktop');

  const patterns = useMemo(() => patternMap(files), [files]);
  const rendered = useMemo(() => renderPage(state, files, page, patterns), [state, files, page, patterns]);
  const css = useMemo(() => {
    // Fonts are served by the app itself: map their theme paths to public URLs.
    const byPath = new Map(assets.map((a) => [a.path, publicUrl(a.src)]));
    return themeCss(files['theme.json'], (p) => byPath.get(p) ?? '');
  }, [files, assets]);

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

  function go(p: PreviewPage) {
    setPage(p);
    iframeRef.current?.contentWindow?.scrollTo(0, 0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <nav className="flex flex-wrap gap-1" aria-label="Preview pages">
          {PREVIEW_PAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-current={page === p.key ? 'page' : undefined}
              onClick={() => go(p.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                page === p.key ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1" role="radiogroup" aria-label="Device width">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={device === d}
              onClick={() => setDevice(d)}
              className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                device === d ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-slate-200">
        <iframe
          ref={iframeRef}
          title="Quick preview of your theme"
          srcDoc={SHELL}
          onLoad={() => setReady(true)}
          className="h-full min-h-[60vh] border-0 bg-white shadow-sm transition-[width]"
          style={{ width: WIDTHS[device] }}
        />
      </div>
    </div>
  );
}
