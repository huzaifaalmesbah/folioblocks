/**
 * Whether the student's work is safe in this browser, so the builder can
 * say so: saved, not saved because storage is full, or not kept at all
 * (storage blocked). Also notices when another tab changed the draft.
 */
import { create } from 'zustand';

export type SaveState = 'saved' | 'full' | 'blocked';

function storageWorks(): boolean {
  try {
    const k = '__folioblocks_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export const useSaveStatus = create<{
  state: SaveState;
  /** When the draft was last saved (ms), 0 before the first save. */
  at: number;
  /** Another tab saved a different draft since this one loaded. */
  otherTab: boolean;
}>(() => ({ state: storageWorks() ? 'saved' : 'blocked', at: 0, otherTab: false }));

export function noteSave(ok: boolean): void {
  useSaveStatus.setState(ok ? { state: 'saved', at: Date.now() } : { state: storageWorks() ? 'full' : 'blocked' });
}

let asked = false;
/** Ask the browser to keep this site's storage when space runs low. Silently does nothing where unsupported. */
export function requestPersistence(): void {
  if (asked) return;
  asked = true;
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    // Unsupported: the browser decides on its own.
  }
}

/** Notice saves from other tabs (the `storage` event only fires for other tabs). Returns a stop function. */
export function watchOtherTabs(key: string): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) useSaveStatus.setState({ otherTab: true });
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
