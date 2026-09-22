import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_INDICES_SETTINGS } from '@/constants';
import { IndicesSettingsContext } from '@/settings';
import type { IndicesSettings } from '@/types';

import type { IndicesSettingsProviderProps } from './types';

/** Pas de persistance pour l'instant (contrairement a `SettingsProvider`/Boussole) : reglages
 * remis a zero a chaque lancement, le temps que le jeu ait plus d'un lieu a proposer. */
export const IndicesSettingsProvider = ({ children }: IndicesSettingsProviderProps) => {
  const [settings, setSettings] = useState<IndicesSettings>(DEFAULT_INDICES_SETTINGS);

  const updateSettings = useCallback((patch: Partial<IndicesSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <IndicesSettingsContext.Provider value={value}>{children}</IndicesSettingsContext.Provider>;
};
