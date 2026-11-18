/**
 * Photos live in IndexedDB, not in localStorage. A draft's photos (data URLs)
 * can fill localStorage's ~5 MB; IndexedDB usually allows hundreds of MB.
 * The draft in localStorage keeps a small `idb:<key>` reference instead.
 *
 * Where IndexedDB isn't available (some private windows, tests), photos stay
 * inline in localStorage, as before.
 */

const DB = 'folioblocks';
const STORE = 'images';
const PREFIX = 'idb:';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') return resolve(null);
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function run<T>(d: IDBDatabase, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** A short, stable key for a photo: the same photo always gets the same key. */
function keyOf(dataUrl: string): string {
  let h = 2166136261;
  for (let i = 0; i < dataUrl.length; i++) {
    h ^= dataUrl.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${(h >>> 0).toString(36)}-${dataUrl.length.toString(36)}`;
}

const isPhoto = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:image/');
const isRef = (v: unknown): v is string => typeof v === 'string' && v.startsWith(PREFIX);

/** Copy `value`, replacing every string `swap` returns something for. */
function mapStrings(value: unknown, swap: (s: string) => string | undefined): unknown {
  if (typeof value === 'string') return swap(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, swap));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, swap)]));
  return value;
}

function collect(value: unknown, test: (s: string) => boolean, out: Set<string>): Set<string> {
  if (typeof value === 'string') {
    if (test(value)) out.add(value);
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, test, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collect(v, test, out));
  return out;
}

/**
 * Before saving: move photos to IndexedDB and put references in the JSON.
 * Photos no longer used anywhere are deleted. Falls back to the JSON as it is.
 */
export async function packPhotos(json: string): Promise<string> {
  const d = await db();
  if (!d) return json;
  try {
    const data = JSON.parse(json) as unknown;
    const photos = collect(data, isPhoto, new Set());
    const keys = new Map([...photos].map((p) => [p, keyOf(p)]));
    const have = new Set((await run(d, 'readonly', (s) => s.getAllKeys())) as string[]);
    for (const [photo, key] of keys) if (!have.has(key)) await run(d, 'readwrite', (s) => s.put(photo, key));
    const used = new Set(keys.values());
    for (const key of have) if (!used.has(key)) await run(d, 'readwrite', (s) => s.delete(key));
    return JSON.stringify(mapStrings(data, (s) => (isPhoto(s) ? PREFIX + keys.get(s) : undefined)));
  } catch {
    return json;
  }
}

/** After loading: put the photos back in place of their references. A missing photo becomes empty (the placeholder). */
export async function unpackPhotos(json: string): Promise<string> {
  if (!json.includes(`"${PREFIX}`)) return json;
  const d = await db();
  try {
    const data = JSON.parse(json) as unknown;
    const refs = collect(data, isRef, new Set());
    const found = new Map<string, string>();
    if (d) {
      for (const ref of refs) {
        const photo = (await run(d, 'readonly', (s) => s.get(ref.slice(PREFIX.length)))) as string | undefined;
        if (photo) found.set(ref, photo);
      }
    }
    return JSON.stringify(mapStrings(data, (s) => (isRef(s) ? (found.get(s) ?? '') : undefined)));
  } catch {
    return json;
  }
}
