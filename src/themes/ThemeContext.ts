import { createContext, useContext, useMemo } from 'react';

import type { Theme, ThemeMode } from '@/types';

import { night } from './night';

export type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({ theme: night, mode: 'auto', setMode: () => {} });

export const useTheme = (): Theme => useContext(ThemeContext).theme;

/** Apparence choisie (auto / clair / sombre) et son setter. */
export const useThemeSwitcher = (): ThemeContextValue => useContext(ThemeContext);

/**
 * Styles derives du theme courant. `createStyles` doit etre defini au niveau du module
 * (identite stable), sinon les styles sont recalcules a chaque rendu.
 */
export const useThemedStyles = <T>(createStyles: (theme: Theme) => T): T => {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
};
