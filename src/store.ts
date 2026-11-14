import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultState } from './defaults';
import type { BuilderState, Info, Style } from './types';

type Store = BuilderState & {
  setInfo: (patch: Partial<Info>) => void;
  setStyle: (patch: Partial<Style>) => void;
  setPalette: (key: keyof Style['palette'], value: string) => void;
  reset: () => void;
};

export const useBuilder = create<Store>()(
  persist(
    (set) => ({
      ...defaultState,
      setInfo: (patch) => set((s) => ({ info: { ...s.info, ...patch } })),
      setStyle: (patch) => set((s) => ({ style: { ...s.style, ...patch } })),
      setPalette: (key, value) =>
        set((s) => ({
          style: { ...s.style, palette: { ...s.style.palette, [key]: value } },
        })),
      reset: () => set(defaultState),
    }),
    { name: 'folioblocks-state', version: 1 },
  ),
);

/** Strip store actions, leaving only serialisable BuilderState. */
export function pickState(s: Store): BuilderState {
  return { info: s.info, style: s.style, preset: s.preset, pages: s.pages };
}
