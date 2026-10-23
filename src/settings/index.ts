import { create } from 'zustand';

import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { loadPlayerName, loadSettings, savePlayerName, saveSettings } from '@/helpers';
import type { GameSettings } from '@/types';

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

export type PlayerNameContextValue = {
  playerName: string;
  /** Faux tant que le nom sauvegarde n'est pas lu (`hydratePlayerName`). */
  ready: boolean;
  setPlayerName: (name: string) => void;
};

/**
 * Nom du joueur, partage (le `playerName` des reglages n'en est que le miroir, voir la synchro de `useSetupRoom`,
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
