import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultState } from './defaults';
import { addSection, layoutFromState, moveSection, removeSection, type SavedLayout } from './layout';
import { presetByKey } from './presets';
import { OLD_DEFAULT_BIO } from './samples';
import type { BuilderState, FooterVariant, HeaderVariant, Info, Language, PageKey, Palette, SectionType, Style } from './types';

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
  setLanguage: (v: Language) => void;
  setHeader: (v: HeaderVariant) => void;
  setFooter: (v: FooterVariant) => void;
  setSectionVariant: (page: PageKey, id: string, variant: string) => void;
  addSection: (page: PageKey, type: SectionType) => void;
  removeSection: (page: PageKey, id: string) => void;
  moveSection: (page: PageKey, from: number, to: number) => void;
  /** Layouts the student saved, to switch between or reuse. */
  savedLayouts: SavedLayout[];
  saveLayout: (label: string) => void;
  applyLayout: (key: string) => void;
  deleteLayout: (key: string) => void;
  /** Replace everything with an imported settings file. */
  importSettings: (state: BuilderState, layouts: SavedLayout[]) => void;
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
          // A template written for a language switches to it; the others keep the student's choice.
          ...(p.language && { language: p.language }),
        });
      },
      setLanguage: (language) => set({ language }),
      setHeader: (header) => set({ header }),
      setFooter: (footer) => set({ footer }),
      setSectionVariant: (page, id, variant) =>
        set((s) => ({
          pages: { ...s.pages, [page]: s.pages[page].map((sec) => (sec.id === id ? { ...sec, variant } : sec)) },
        })),
      addSection: (page, type) => set((s) => ({ pages: { ...s.pages, [page]: addSection(s.pages[page], type) } })),
      removeSection: (page, id) => set((s) => ({ pages: { ...s.pages, [page]: removeSection(s.pages[page], id) } })),
      moveSection: (page, from, to) =>
        set((s) => ({ pages: { ...s.pages, [page]: moveSection(s.pages[page], from, to) } })),
      savedLayouts: [],
      saveLayout: (label) =>
        set((s) => {
          const layout = layoutFromState(s, label);
          return { savedLayouts: [...s.savedLayouts, layout], preset: layout.key };
        }),
      applyLayout: (key) =>
        set((s) => {
          const l = s.savedLayouts.find((x) => x.key === key);
          if (!l) return {};
          return {
            preset: l.key,
            style: structuredClone(l.style),
            header: l.header,
            footer: l.footer,
            pages: structuredClone(l.pages),
          };
        }),
      deleteLayout: (key) => set((s) => ({ savedLayouts: s.savedLayouts.filter((l) => l.key !== key) })),
      // Imported layouts join the saved ones (same key: the file wins), so loading a draft never loses a layout.
      importSettings: (state, layouts) =>
        set((s) => ({
          ...structuredClone(state),
          savedLayouts: [...s.savedLayouts.filter((l) => !layouts.some((x) => x.key === l.key)), ...layouts],
        })),
      // Reset clears the draft but keeps saved layouts: they are the student's own work.
      reset: () => set(structuredClone(defaultState)),
    }),
    {
      name: 'folioblocks-state',
      version: 6,
      storage: createJSONStorage(() => safeStorage),
      // Older drafts lack newer fields (v2: header/footer, v3: photos): fill them in from the defaults.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<BuilderState>;
        return {
          ...structuredClone(defaultState),
          ...old,
          // v4 dropped the cover image: don't keep its data in storage.
          info: {
            ...defaultState.info,
            ...old.info,
            // The old placeholder bio counts as empty (v5), so it doesn't ship in a theme.
            bio: old.info?.bio === OLD_DEFAULT_BIO ? '' : (old.info?.bio ?? ''),
            cover: undefined,
          } as BuilderState['info'],
          header: old.header ?? defaultState.header,
          footer: old.footer ?? defaultState.footer,
        } as Store;
      },
    },
  ),
);

/** Strip store actions, leaving only serialisable BuilderState. */
export function pickState(s: BuilderState): BuilderState {
  return { info: s.info, language: s.language ?? 'en', style: s.style, preset: s.preset, header: s.header, footer: s.footer, pages: s.pages };
}
