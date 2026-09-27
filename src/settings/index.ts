import { createContext, useContext } from 'react';
import { create } from 'zustand';

import { DEFAULT_CONTOUR_SETTINGS, DEFAULT_INDICES_SETTINGS, DEFAULT_SETTINGS } from '@/constants';
import { loadSettings, saveSettings } from '@/helpers';
import type { ContourSettings, GameSettings, IndicesSettings } from '@/types';

export type SettingsContextValue = {
  settings: GameSettings;
  /** False until the saved settings have been read (defaults are returned until then). */
  ready: boolean;
  updateSettings: (patch: Partial<GameSettings>) => void;
  /** Resets the in-memory settings to defaults without rewriting storage (used
   * after "Clear data": otherwise the screen keeps the in-memory values until the app's
   * next launch, even though storage is already empty). */
  resetSettings: () => void;
};

/** Boussole settings — a Zustand store rather than a Context, but the same public hook shape
 * (`useSettings()` returns `{ settings, ready, updateSettings, resetSettings }`), so every
 * consumer (`SetupScreen`, `useGame`, `SettingsScreen`) is unaffected by this. Never hydrated at
 * import time (see `hydrateSettings`) — a store singleton's module evaluation must stay
 * side-effect-free, unlike a Provider's mount effect, or every test that imports this module
 * transitively (even ones mocking `@/helpers` without `loadSettings`) would crash on import. */
export const useSettings = create<SettingsContextValue>()((set) => ({
  settings: DEFAULT_SETTINGS,
  ready: false,
  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      saveSettings(next);
      return { settings: next };
    }),
  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
}));

/** Reads the persisted settings once and flips `ready` — called once from the root layout
 * (`src/app/_layout.tsx`), replacing `SettingsProvider`'s old mount effect. */
export const hydrateSettings = (): void => {
  loadSettings().then((settings) => useSettings.setState({ settings, ready: true }));
};

/** Indices game settings: independent context, never mixed with `GameSettings` (Boussole). */
export type IndicesSettingsContextValue = {
  settings: IndicesSettings;
  updateSettings: (patch: Partial<IndicesSettings>) => void;
};

export const IndicesSettingsContext = createContext<IndicesSettingsContextValue>({
  settings: DEFAULT_INDICES_SETTINGS,
  updateSettings: () => {},
});

export const useIndicesSettings = (): IndicesSettingsContextValue => useContext(IndicesSettingsContext);

/** Contour game settings: independent context, never mixed with `GameSettings`/`IndicesSettings`. */
export type ContourSettingsContextValue = {
  settings: ContourSettings;
  updateSettings: (patch: Partial<ContourSettings>) => void;
};

export const ContourSettingsContext = createContext<ContourSettingsContextValue>({
  settings: DEFAULT_CONTOUR_SETTINGS,
  updateSettings: () => {},
});

export const useContourSettings = (): ContourSettingsContextValue => useContext(ContourSettingsContext);
