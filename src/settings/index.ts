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

/** Clues game settings: independent store, never mixed with `GameSettings` (Compass). No
 * persistence (unlike `useSettings` above) — resets to defaults on every launch, until the game
 * has more than one place pool to offer, same as before this was a plain Context. */
export type ClueSettingsContextValue = {
  settings: ClueSettings;
  updateSettings: (patch: Partial<ClueSettings>) => void;
};

export const useClueSettings = create<ClueSettingsContextValue>()((set) => ({
  settings: DEFAULT_CLUE_SETTINGS,
  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));

/** Contour game settings: independent store, never mixed with `GameSettings`/`ClueSettings`. No
 * persistence, same as `useClueSettings` above. */
export type ContourSettingsContextValue = {
  settings: ContourSettings;
  updateSettings: (patch: Partial<ContourSettings>) => void;
};

export const useContourSettings = create<ContourSettingsContextValue>()((set) => ({
  settings: DEFAULT_CONTOUR_SETTINGS,
  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));
