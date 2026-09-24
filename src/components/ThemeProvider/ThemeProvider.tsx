import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadThemeId, saveThemeId } from '@/helpers';
import { ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

import type { ThemeProviderProps } from './types';

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [themeId, setThemeIdState] = useState<ThemeId>('night');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadThemeId().then((stored) => {
      if (cancelled) return;
      setThemeIdState(stored);
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

  const value = useMemo(
    () => ({ themeId, ready, setThemeId, resetThemeId }),
    [themeId, ready, setThemeId, resetThemeId],
  );

  return <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>;
};
