import { fontDef, type FontKey } from '../fonts';

/** Absolute URL of a file the app serves from public/ (works on GitHub Pages and in dev). */
export function publicUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.href).href;
}

/** Fetch theme asset files (e.g. assets/fonts/inter.woff2) from the app's public/ folder. */
export async function fetchAssets(paths: string[]): Promise<Record<string, Uint8Array>> {
  const entries = await Promise.all(
    paths.map(async (p) => {
      const res = await fetch(publicUrl(p.replace(/^assets\//, '')));
      if (!res.ok) throw new Error(`Could not load ${p} (${res.status})`);
      return [p, new Uint8Array(await res.arrayBuffer())] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Make bundled fonts available to <canvas> drawing (used by the screenshot). */
export async function loadFonts(keys: FontKey[]): Promise<void> {
  await Promise.all(
    keys.map(async (k) => {
      const f = fontDef(k);
      if (!f.file) return;
      const face = new FontFace(f.name, `url(${publicUrl(`fonts/${f.file}`)})`, { weight: f.weight });
      document.fonts.add(await face.load());
    }),
  );
}
