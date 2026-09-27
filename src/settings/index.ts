import { createContext, useContext } from 'react';
import { create } from 'zustand';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadSettings, saveSettings } from '@/helpers';
import type { ClueSettings, ContourSettings, GameSettings } from '@/types';

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

/** Compass settings — a Zustand store rather than a Context, but the same public hook shape
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

/** Clues game settings: independent context, never mixed with `GameSettings` (Compass). */
export type ClueSettingsContextValue = {
  settings: ClueSettings;
  updateSettings: (patch: Partial<ClueSettings>) => void;
};

export const ClueSettingsContext = createContext<ClueSettingsContextValue>({
  settings: DEFAULT_CLUE_SETTINGS,
  updateSettings: () => {},
});

export const useClueSettings = (): ClueSettingsContextValue => useContext(ClueSettingsContext);

/** Contour game settings: independent context, never mixed with `GameSettings`/`ClueSettings`. */
export type ContourSettingsContextValue = {
  settings: ContourSettings;
  updateSettings: (patch: Partial<ContourSettings>) => void;
};

export const ContourSettingsContext = createContext<ContourSettingsContextValue>({
  settings: DEFAULT_CONTOUR_SETTINGS,
  updateSettings: () => {},
});

export const useContourSettings = (): ContourSettingsContextValue => useContext(ContourSettingsContext);
