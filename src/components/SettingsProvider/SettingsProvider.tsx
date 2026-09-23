import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_SETTINGS } from '@/constants';
import { loadSettings, saveSettings } from '@/helpers';
import { SettingsContext } from '@/settings';
import type { GameSettings } from '@/types';

import type { SettingsProviderProps } from './types';

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ settings, ready, updateSettings, resetSettings }),
    [settings, ready, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
