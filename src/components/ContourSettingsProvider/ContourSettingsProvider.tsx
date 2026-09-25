import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_CONTOUR_SETTINGS } from '@/constants';
import { ContourSettingsContext } from '@/settings';
import type { ContourSettings } from '@/types';

import type { ContourSettingsProviderProps } from './types';

/** No persistence for now (unlike `SettingsProvider`/Boussole): settings reset on every
 * launch, same as `IndicesSettingsProvider`. */
export const ContourSettingsProvider = ({ children }: ContourSettingsProviderProps) => {
  const [settings, setSettings] = useState<ContourSettings>(DEFAULT_CONTOUR_SETTINGS);

  const updateSettings = useCallback((patch: Partial<ContourSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <ContourSettingsContext.Provider value={value}>{children}</ContourSettingsContext.Provider>;
};
