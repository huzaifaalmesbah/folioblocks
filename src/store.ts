import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { defaultState } from './defaults';
import { addSection, layoutFromState, moveSection, removeSection, type SavedLayout } from './layout';
import { presetByKey } from './presets';
import { OLD_DEFAULT_BIO } from './samples';
import { packPhotos, unpackPhotos } from './imageStore';
import { noteSave } from './saveStatus';
import type { BuilderState, FooterVariant, HeaderVariant, Info, Language, PageKey, Palette, SectionType, Style } from './types';

/**
 * The draft's storage: localStorage for the text, IndexedDB for photos
 * (see imageStore.ts), and it never throws: a failed save must not break
 * the app, it shows in the save status instead. Saves run one at a time
 * and only the newest waiting one is written, so typing fast never lets an
 * older draft land last.
 */
let saving: Promise<void> = Promise.resolve();
let pending: { key: string; value: string } | null = null;

const draftStorage: StateStorage = {
  getItem: async (k) => {
    try {
      const raw = localStorage.getItem(k);
      return raw === null ? null : await unpackPhotos(raw);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    pending = { key: k, value: v };
    saving = saving.then(async () => {
      if (!pending) return;
      const { key, value } = pending;
      pending = null;
      try {
        localStorage.setItem(key, await packPhotos(value));
        noteSave(true);
      } catch {
        // Out of space, or storage switched off: say so instead of failing.
        noteSave(false);
      }
    });
    return saving;
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // Storage switched off: nothing to remove.
    }
  },
};

/** Where the draft lives in localStorage. */
export const STORAGE_KEY = 'folioblocks-state';

/** The parts of the state a template or saved design sets. */
type Design = Pick<BuilderState, 'style' | 'header' | 'footer' | 'pages'>;

/** What the current design started from: a template or a saved design. */
export function sourceDesign(state: Pick<BuilderState, 'preset'>, saved: SavedLayout[]): (Design & { label: string; saved: boolean }) | null {
  const l = saved.find((x) => x.key === state.preset);
  if (l) return { ...l, saved: true };
  const p = presetByKey(state.preset);
  return p.key === state.preset ? { ...p, saved: false } : null;
}

/** Compare designs by what shows (section ids don't count; a missing look is Plain). */
function designKey(d: Design): string {
  const pages = Object.fromEntries(Object.entries(d.pages).map(([k, list]) => [k, list.map((x) => `${x.type}/${x.variant}`)]));
  return JSON.stringify({ style: { ...d.style, look: d.style.look ?? 'plain' }, header: d.header, footer: d.footer, pages });
}

/** Whether the student changed the design since picking its template (or saved design). */
export function designChanged(state: BuilderState, saved: SavedLayout[]): boolean {
  const source = sourceDesign(state, saved);
  return !!source && designKey(source) !== designKey(state);
}

/** Keep a changed design before a switch replaces it: the three latest are kept in My saved designs. */
function backupIfChanged(s: BuilderState & { savedLayouts: SavedLayout[] }): SavedLayout[] {
  if (!designChanged(s, s.savedLayouts)) return s.savedLayouts;
  const when = new Date().toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const backup: SavedLayout = { ...layoutFromState(s, `Before switching · ${when}`), auto: true };
  const autos = s.savedLayouts.filter((l) => l.auto);
  const drop = autos.length >= 3 ? autos[0].key : null;
  return [...s.savedLayouts.filter((l) => l.key !== drop), backup];
}

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
        set((s) => ({
          savedLayouts: backupIfChanged(s),
          preset: p.key,
          style: structuredClone(p.style),
          header: p.header,
          footer: p.footer,
          pages: structuredClone(p.pages),
        }));
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
            savedLayouts: backupIfChanged(s),
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
      name: STORAGE_KEY,
      version: 7,
      storage: createJSONStorage(() => draftStorage),
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
