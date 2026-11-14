import { fontDef, type FontKey, type ThemeAsset } from '../fonts';

/** Absolute URL of a file the app serves from public/ (works on GitHub Pages and in dev). */
export function publicUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.href).href;
}

/** Where the browser can load an asset from: the student's data URL, or the app's public/ file. */
export function assetUrl(a: ThemeAsset): string {
  return a.data ?? publicUrl(a.src ?? '');
}

/** Fetch theme asset files (fonts, images), keyed by their path in the theme. */
export async function fetchAssets(assets: ThemeAsset[]): Promise<Record<string, Uint8Array>> {
  const entries = await Promise.all(
    assets.map(async (a) => {
      const res = await fetch(assetUrl(a));
      if (!res.ok) throw new Error(`Could not load ${a.path} (${res.status})`);
      return [a.path, new Uint8Array(await res.arrayBuffer())] as const;
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
