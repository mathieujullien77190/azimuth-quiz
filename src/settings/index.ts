import { create } from 'zustand';

import { DEV_CODE } from '@/data';
import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadDevCode, loadPlayerName, loadSettings, saveDevCode, savePlayerName, saveSettings } from '@/helpers';
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

export type PlayerNameContextValue = {
  playerName: string;
  /** False until the saved name has been read (see `hydratePlayerName`). */
  ready: boolean;
  setPlayerName: (name: string) => void;
};

/** The player's name, the one thing shared by the 3 games (`GameSettings`/`ClueSettings`/
 * `ContourSettings` each still keep their own `playerName` field, but only as a mirror of this —
 * see `useSetupRoom`'s sync effect, which also migrates an already-persisted name (Compass, the
 * only one of the 3 to persist on its own) into this store the very first time it hydrates
 * empty). Persisted on every change (unlike a room rename, this never touches Firestore, so no
 * debounce is needed here — see `PLAYER_NAME_STORAGE_KEY`). */
export const usePlayerName = create<PlayerNameContextValue>()((set) => ({
  playerName: '',
  ready: false,
  setPlayerName: (name) => {
    set({ playerName: name });
    savePlayerName(name);
  },
}));

/** Reads the persisted name once and flips `ready` — called once from the root layout, like
 * `hydrateSettings`. */
export const hydratePlayerName = (): void => {
  loadPlayerName().then((name) => usePlayerName.setState({ playerName: name ?? '', ready: true }));
};

export type DevCodeContextValue = {
  /** What was typed in the settings' "dev" field, as typed. */
  devCode: string;
  /** False until the saved code has been read (see `hydrateDevCode`). */
  ready: boolean;
  setDevCode: (code: string) => void;
};

/** The dev code typed in the settings. Typing it does nothing by itself: it is only saved here, and the games read it
 * through `useDevMode` (the difficulty feedback of `useDevFeedback`). Persisted on every change. */
export const useDevCode = create<DevCodeContextValue>()((set) => ({
  devCode: '',
  ready: false,
  setDevCode: (code) => {
    set({ devCode: code });
    saveDevCode(code);
  },
}));

/** Reads the saved dev code once and flips `ready` — called once from the root layout, like `hydratePlayerName`. */
export const hydrateDevCode = (): void => {
  loadDevCode().then((code) => useDevCode.setState({ devCode: code ?? '', ready: true }));
};

/** Whether this device has the dev mode on: the saved code is exactly `DEV_CODE` (spaces around it ignored). */
export const useDevMode = (): boolean => useDevCode((state) => state.devCode.trim() === DEV_CODE);
