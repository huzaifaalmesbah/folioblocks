import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PlaygroundClient, StartPlaygroundWebOptions } from '@wp-playground/client';
import type { ThemeAsset } from '../fonts';
import type { BuilderState, ThemeFiles } from '../types';
import { publicUrl } from '../zip/assets';
import { buildBlueprint } from './blueprint';

/**
 * The client comes from the same Playground deployment as remote.html, as
 * Playground's README recommends, so the two never drift apart. The npm
 * package is only used for its TypeScript types.
 */
const CLIENT_URL = 'https://playground.wordpress.net/client/index.js';
const REMOTE_URL = 'https://playground.wordpress.net/remote.html';

/**
 * The preview installs the theme in a fixed folder, whatever the student's
 * name, so renaming only rewrites files instead of reinstalling WordPress.
 */
const PREVIEW_FOLDER = 'folioblocks-preview';

/** How long to wait for WordPress to boot before showing the fallback message. */
const BOOT_TIMEOUT_MS = 90_000;

type StartPlaygroundWeb = (options: StartPlaygroundWebOptions) => Promise<PlaygroundClient>;

let clientModule: Promise<{ startPlaygroundWeb: StartPlaygroundWeb }> | undefined;
function loadClient() {
  clientModule ??= import(/* @vite-ignore */ CLIENT_URL);
  return clientModule;
}

export type Device = 'desktop' | 'tablet' | 'mobile';
const WIDTHS: Record<Device, string> = { desktop: '100%', tablet: '768px', mobile: '390px' };

const PAGES = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about/' },
  { label: 'Blog', path: '/blog/' },
  { label: 'Post', path: '/my-first-wordpress-contribution/' },
  { label: 'Contact', path: '/contact/' },
];

type Status = 'booting' | 'syncing' | 'ready' | 'error';

/** The site title and tagline, as one comparable value. */
function siteKey(state: BuilderState): string {
  return JSON.stringify([state.info.name, state.info.tagline]);
}

/** Strip Playground's "/scope:abc" prefix from a URL, leaving the site path. */
function sitePath(url: string): string {
  try {
    const path = new URL(url, 'https://x').pathname + new URL(url, 'https://x').search;
    return path.replace(/^\/scope:[^/]+/, '') || '/';
  } catch {
    return '/';
  }
}

/**
 * A real WordPress, running in the browser, with the generated theme
 * installed. It boots once from the Blueprint; after that, edits are synced
 * by writing only the changed theme files and reloading the current page.
 */
export function LivePreview(props: { state: BuilderState; slug: string; files: ThemeFiles; assets: ThemeAsset[] }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const clientRef = useRef<PlaygroundClient | null>(null);
  /** What WordPress has now: a copy of the files, the asset paths, and the `files` object they came from. */
  const synced = useRef<{ files: ThemeFiles; assets: Set<string>; source: ThemeFiles | null }>({
    files: {},
    assets: new Set(),
    source: null,
  });
  /** The site title and tagline WordPress has, which live in options, not theme files. */
  const syncedSite = useRef('');
  const currentPath = useRef('/');
  const busy = useRef(false);
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });

  const [status, setStatus] = useState<Status>('booting');
  const [error, setError] = useState('');
  const [device, setDevice] = useState<Device>('desktop');
  const [path, setPath] = useState('/');
  const [tick, setTick] = useState(0);

  /** Boot WordPress once with the full Blueprint. */
  async function boot() {
    const { state, slug, files, assets } = latest.current;
    setStatus('booting');
    setError('');
    const { startPlaygroundWeb } = await loadClient();
    const start = startPlaygroundWeb({
      iframe: iframeRef.current!,
      remoteUrl: REMOTE_URL,
      blueprint: buildBlueprint(state, slug, files, assets, {
        folder: PREVIEW_FOLDER,
        developmentMode: true,
      }) as StartPlaygroundWebOptions['blueprint'],
    });
    // Some browsers never let an embedded Playground start (for example when
    // third-party storage is blocked). Don't spin forever: say so and offer the new-tab button.
    const client = await Promise.race([
      start,
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'WordPress did not start inside this page. Your browser may block storage for embedded sites. "Open in WordPress Playground" still works in a new tab.',
              ),
            ),
          BOOT_TIMEOUT_MS,
        ),
      ),
    ]);
    clientRef.current = client;
    synced.current = { files: { ...files }, assets: new Set(assets.map((a) => a.path)), source: files };
    syncedSite.current = siteKey(state);
    await client.onNavigation((url) => {
      currentPath.current = sitePath(url);
      setPath(currentPath.current);
    });
    // The remote frame stays blank until it is told which page to show.
    await client.goTo(currentPath.current);
  }

  /** Write the theme files that changed since the last sync, then reload the page. */
  async function sync() {
    const client = clientRef.current!;
    const { state, files, assets } = latest.current;
    const dir = `/wordpress/wp-content/themes/${PREVIEW_FOLDER}`;
    const before = synced.current;
    let changed = 0;

    for (const [path, content] of Object.entries(files)) {
      if (before.files[path] === content) continue;
      await client.mkdirTree(`${dir}/${path.slice(0, path.lastIndexOf('/'))}`);
      await client.writeFile(`${dir}/${path}`, content);
      changed++;
    }
    for (const path of Object.keys(before.files)) {
      if (!(path in files)) {
        await client.unlink(`${dir}/${path}`);
        changed++;
      }
    }
    for (const a of assets) {
      if (before.assets.has(a.path)) continue;
      const res = await fetch(publicUrl(a.src));
      await client.mkdirTree(`${dir}/${a.path.slice(0, a.path.lastIndexOf('/'))}`);
      await client.writeFile(`${dir}/${a.path}`, new Uint8Array(await res.arrayBuffer()));
      changed++;
    }

    if (siteKey(state) !== syncedSite.current) {
      // JSON in base64, so any name or tagline reaches PHP intact.
      const data = btoa(String.fromCharCode(...new TextEncoder().encode(siteKey(state))));
      await client.run({
        code: `<?php require '/wordpress/wp-load.php'; $s = json_decode( base64_decode( '${data}' ), true ); update_option( 'blogname', $s[0] ); update_option( 'blogdescription', $s[1] );`,
      });
      syncedSite.current = siteKey(state);
      changed++;
    }

    synced.current = { files: { ...files }, assets: new Set(assets.map((a) => a.path)), source: files };
    if (changed) await client.goTo(currentPath.current);
  }

  /** Run one boot or sync at a time; if edits arrive meanwhile, sync again after. */
  async function update() {
    if (busy.current) return;
    busy.current = true;
    try {
      for (;;) {
        const { files } = latest.current;
        if (!clientRef.current) await boot();
        else if (files !== synced.current.source) {
          setStatus('syncing');
          await sync();
        }
        if (latest.current.files === files) break;
      }
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      busy.current = false;
    }
  }

  // Debounce edits so typing a name doesn't reload WordPress on every key.
  useEffect(() => {
    const t = setTimeout(update, clientRef.current ? 700 : 0);
    return () => clearTimeout(t);
  }, [props.files, tick]);

  function go(p: string) {
    currentPath.current = p;
    setPath(p);
    clientRef.current?.goTo(p);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <nav className="flex flex-wrap gap-1" aria-label="Preview pages">
          {PAGES.map((p) => (
            <button
              key={p.path}
              type="button"
              disabled={status === 'booting'}
              aria-current={path === p.path ? 'page' : undefined}
              onClick={() => go(p.path)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                path === p.path ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
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
          <span className="ml-2 min-w-20 text-right text-xs text-slate-500" role="status">
            {status === 'booting' ? 'Starting WordPress…' : status === 'syncing' ? 'Updating…' : status === 'ready' ? 'Live' : ''}
          </span>
        </div>
      </div>

      {status === 'error' && (
        <div role="alert" className="flex items-center gap-3 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
          <button
            type="button"
            className="shrink-0 underline"
            onClick={() => {
              clientRef.current = null;
              setTick((n) => n + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-slate-200 p-0">
        <iframe
          ref={iframeRef}
          title="Live preview of your theme in WordPress"
          className="h-full min-h-[60vh] border-0 bg-white shadow-sm transition-[width]"
          style={{ width: WIDTHS[device] }}
        />
      </div>
    </div>
  );
}
