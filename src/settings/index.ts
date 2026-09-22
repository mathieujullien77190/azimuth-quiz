import { createContext, useContext } from 'react';

import { DEFAULT_SETTINGS } from '@/constants';
import type { GameSettings } from '@/types';

export type SettingsContextValue = {
  settings: GameSettings;
  /** Faux tant que les reglages sauvegardes ne sont pas lus (les defauts sont alors renvoyes). */
  ready: boolean;
  updateSettings: (patch: Partial<GameSettings>) => void;
};

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: true,
  updateSettings: () => {},
});

export const useSettings = (): SettingsContextValue => useContext(SettingsContext);
