import { useCallback, useMemo, useState } from 'react';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { ClueSettingsContext } from '@/settings';
import type { ClueSettings } from '@/types';

import type { ClueSettingsProviderProps } from './types';

/** No persistence for now (unlike `SettingsProvider`/Compass): settings reset on every
 * launch, until the game has more than one place pool to offer. */
export const ClueSettingsProvider = ({ children }: ClueSettingsProviderProps) => {
  const [settings, setSettings] = useState<ClueSettings>(DEFAULT_CLUE_SETTINGS);

  const updateSettings = useCallback((patch: Partial<ClueSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
  }, []);

  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);

  return <ClueSettingsContext.Provider value={value}>{children}</ClueSettingsContext.Provider>;
};
