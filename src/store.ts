import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultState } from './defaults';
import { presetByKey } from './presets';
import type { BuilderState, FooterVariant, HeaderVariant, Info, PageKey, Palette, Style } from './types';

/** Set when the browser refused to save (photos can fill localStorage). */
export const storageStatus = { full: false };

/**
 * localStorage that never throws: photos can push a draft past the
 * browser's quota, and a failed save must not break the app.
 */
const safeStorage: Storage = {
  get length() {
    return localStorage.length;
  },
  clear: () => localStorage.clear(),
  key: (i) => localStorage.key(i),
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  removeItem: (k) => localStorage.removeItem(k),
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
      storageStatus.full = false;
    } catch {
      storageStatus.full = true;
    }
  },
};

type Store = BuilderState & {
  setInfo: (patch: Partial<Info>) => void;
  setStyle: (patch: Partial<Style>) => void;
  setPalette: (key: keyof Palette, value: string) => void;
  applyPalette: (palette: Palette) => void;
  applyPreset: (key: string) => void;
  setHeader: (v: HeaderVariant) => void;
  setFooter: (v: FooterVariant) => void;
  setSectionVariant: (page: PageKey, id: string, variant: string) => void;
  reset: () => void;
};

export const useBuilder = create<Store>()(
  persist(
    (set) => ({
      ...defaultState,
      setInfo: (patch) => set((s) => ({ info: { ...s.info, ...patch } })),
      setStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
      setPalette: (key, value) =>
        set((s) => ({ style: { ...s.style, palette: { ...s.style.palette, [key]: value } } })),
      applyPalette: (palette) => set((s) => ({ style: { ...s.style, palette: { ...palette } } })),
      applyPreset: (key) => {
        const p = presetByKey(key);
        // Deep-copy so later edits never mutate the preset definitions.
        set({
          preset: p.key,
          style: structuredClone(p.style),
          header: p.header,
          footer: p.footer,
          pages: structuredClone(p.pages),
        });
      },
      setHeader: (header) => set({ header }),
      setFooter: (footer) => set({ footer }),
      setSectionVariant: (page, id, variant) =>
        set((s) => ({
          pages: { ...s.pages, [page]: s.pages[page].map((sec) => (sec.id === id ? { ...sec, variant } : sec)) },
        })),
      reset: () => set(structuredClone(defaultState)),
    }),
    {
      name: 'folioblocks-state',
      version: 4,
      storage: createJSONStorage(() => safeStorage),
      // Older drafts lack newer fields (v2: header/footer, v3: photos): fill them in from the defaults.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<BuilderState>;
        return {
          ...structuredClone(defaultState),
          ...old,
          // v4 dropped the cover image: don't keep its data in storage.
          info: { ...defaultState.info, ...old.info, cover: undefined } as BuilderState['info'],
          header: old.header ?? defaultState.header,
          footer: old.footer ?? defaultState.footer,
        } as Store;
      },
    },
  ),
);

/** Strip store actions, leaving only serialisable BuilderState. */
export function pickState(s: BuilderState): BuilderState {
  return { info: s.info, style: s.style, preset: s.preset, header: s.header, footer: s.footer, pages: s.pages };
}
