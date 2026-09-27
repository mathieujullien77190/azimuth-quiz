import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_INDICES_SETTINGS } from '@/constants';
import { IndicesSettingsContext } from '@/settings';
import type { IndicesSettings } from '@/types';

import type { IndicesSettingsProviderProps } from './types';

/** No persistence for now (unlike `SettingsProvider`/Boussole): settings reset on every
 * launch, until the game has more than one place pool to offer. */
export const IndicesSettingsProvider = ({ children }: IndicesSettingsProviderProps) => {
  const [settings, setSettings] = useState<IndicesSettings>(DEFAULT_INDICES_SETTINGS);

  const updateSettings = useCallback((patch: Partial<IndicesSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <IndicesSettingsContext.Provider value={value}>{children}</IndicesSettingsContext.Provider>;
};
