import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultState } from './defaults';
import { presetByKey } from './presets';
import type { BuilderState, FooterVariant, HeaderVariant, Info, PageKey, Palette, Style } from './types';

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
      version: 2,
      // v1 had no header/footer and only system fonts: fill in the new fields from the defaults.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<BuilderState>;
        return {
          ...structuredClone(defaultState),
          ...old,
          info: { ...defaultState.info, ...old.info },
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
