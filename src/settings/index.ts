import { create } from 'zustand';

import { DEV_CODE } from '@/data';
import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadDevCode, loadPlayerName, loadSettings, saveDevCode, savePlayerName, saveSettings } from '@/helpers';
import type { ClueSettings, GameSettings } from '@/types';

export type SettingsContextValue = {
  settings: GameSettings;
  /** Faux tant que les reglages sauvegardes ne sont pas lus (defauts entre-temps). */
  ready: boolean;
  updateSettings: (patch: Partial<GameSettings>) => void;
  /** Remet les defauts en memoire sans toucher au stockage (apres "Effacer les donnees"). */
  resetSettings: () => void;
};

/**
 * Reglages Boussole (store Zustand). Jamais hydrate a l'import (`hydrateSettings`) : l'evaluation d'un singleton doit
 * rester sans effet de bord, sinon tout test qui l'importe sans `loadSettings` mocke planterait.
 */
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

/** Lit les reglages sauvegardes une fois (appele par `src/app/_layout.tsx`). */
export const hydrateSettings = (): void => {
  loadSettings().then((settings) => useSettings.setState({ settings, ready: true }));
};

/** Reglages Indices : store independant de `GameSettings`, sans persistance (defauts a chaque lancement). */
export type ClueSettingsContextValue = {
  settings: ClueSettings;
  updateSettings: (patch: Partial<ClueSettings>) => void;
};

export const useClueSettings = create<ClueSettingsContextValue>()((set) => ({
  settings: DEFAULT_CLUE_SETTINGS,
  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
}));

export type PlayerNameContextValue = {
  playerName: string;
  /** Faux tant que le nom sauvegarde n'est pas lu (`hydratePlayerName`). */
  ready: boolean;
  setPlayerName: (name: string) => void;
};

/**
 * Nom du joueur, partage par les 2 jeux (leurs `playerName` n'en sont que le miroir, voir la synchro de `useSetupRoom`,
 * qui y migre aussi un nom Compass deja sauve). Persiste a chaque changement, sans debounce (rien vers Firestore).
 */
export const usePlayerName = create<PlayerNameContextValue>()((set) => ({
  playerName: '',
  ready: false,
  setPlayerName: (name) => {
    set({ playerName: name });
    savePlayerName(name);
  },
}));

/** Lit le nom sauvegarde une fois (depuis le layout racine, comme `hydrateSettings`). */
export const hydratePlayerName = (): void => {
  loadPlayerName().then((name) => usePlayerName.setState({ playerName: name ?? '', ready: true }));
};

export type DevCodeContextValue = {
  /** Ce qui a ete tape dans le champ "dev" des reglages. */
  devCode: string;
  /** Faux tant que le code sauvegarde n'est pas lu (`hydrateDevCode`). */
  ready: boolean;
  setDevCode: (code: string) => void;
};

/** Code dev saisi : seulement garde ici, les jeux le lisent via `useDevMode` (avis de difficulte). Persiste a chaque changement. */
export const useDevCode = create<DevCodeContextValue>()((set) => ({
  devCode: '',
  ready: false,
  setDevCode: (code) => {
    set({ devCode: code });
    saveDevCode(code);
  },
}));

/** Lit le code dev sauvegarde une fois (depuis le layout racine). */
export const hydrateDevCode = (): void => {
  loadDevCode().then((code) => useDevCode.setState({ devCode: code ?? '', ready: true }));
};

/** Le mode dev est-il actif : code sauvegarde egal a `DEV_CODE` (espaces ignores). */
export const useDevMode = (): boolean => useDevCode((state) => state.devCode.trim() === DEV_CODE);
