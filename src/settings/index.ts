import { createContext, useContext } from 'react';

import { DEFAULT_INDICES_SETTINGS, DEFAULT_SETTINGS } from '@/constants';
import type { GameSettings, IndicesSettings } from '@/types';

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

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: true,
  updateSettings: () => {},
  resetSettings: () => {},
});

export const useSettings = (): SettingsContextValue => useContext(SettingsContext);

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
