import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadAnimationsEnabled, loadThemeId, saveAnimationsEnabled, saveThemeId } from '@/helpers';
import { ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

import type { ThemeProviderProps } from './types';

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState<ThemeId>('night');
  const [animationsEnabled, setAnimationsEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadThemeId(), loadAnimationsEnabled()]).then(([storedThemeId, storedAnimationsEnabled]) => {
      if (cancelled) return;
      setThemeIdState(storedThemeId);
      setAnimationsEnabledState(storedAnimationsEnabled);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeId = useCallback((next: ThemeId) => {
    setThemeIdState(next);
    saveThemeId(next);
  }, []);

  const resetThemeId = useCallback(() => {
    setThemeIdState('night');
  }, []);

  const setAnimationsEnabled = useCallback((next: boolean) => {
    setAnimationsEnabledState(next);
    saveAnimationsEnabled(next);
  }, []);

  const resetAnimationsEnabled = useCallback(() => {
    setAnimationsEnabledState(false);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      ready,
      setThemeId,
      resetThemeId,
      animationsEnabled,
      setAnimationsEnabled,
      resetAnimationsEnabled,
    }),
    [themeId, ready, setThemeId, resetThemeId, animationsEnabled, setAnimationsEnabled, resetAnimationsEnabled],
  );

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>;
};
