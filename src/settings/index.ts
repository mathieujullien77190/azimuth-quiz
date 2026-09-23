import { createContext, useContext } from 'react';

import { DEFAULT_INDICES_SETTINGS, DEFAULT_SETTINGS } from '@/constants';
import type { GameSettings, IndicesSettings } from '@/types';

export type SettingsContextValue = {
  settings: GameSettings;
  /** Faux tant que les reglages sauvegardes ne sont pas lus (les defauts sont alors renvoyes). */
  ready: boolean;
  updateSettings: (patch: Partial<GameSettings>) => void;
  /** Remet les reglages en memoire aux defauts, sans rien re-ecrire dans le stockage (utilise
   * apres "Vider les donnees" : sinon l'ecran garde les valeurs en memoire jusqu'au prochain
   * lancement de l'app, meme si le stockage est deja vide). */
  resetSettings: () => void;
};

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: true,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useSettings = (): SettingsContextValue => useContext(SettingsContext);

/** Reglages du jeu Indices : contexte independant, jamais melange a `GameSettings` (Boussole). */
export type IndicesSettingsContextValue = {
  settings: IndicesSettings;
  updateSettings: (patch: Partial<IndicesSettings>) => void;
};

export const IndicesSettingsContext = createContext<IndicesSettingsContextValue>({
  settings: DEFAULT_INDICES_SETTINGS,
  updateSettings: () => {},
});

export const useIndicesSettings = (): IndicesSettingsContextValue => useContext(IndicesSettingsContext);
