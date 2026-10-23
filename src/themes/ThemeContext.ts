import { createContext, useContext, useMemo } from 'react';

import type { Theme, ThemeId } from '@/types';

import { day } from './day';
import { night } from './night';

export const THEMES: Record<ThemeId, Theme> = { night, day };

export type ThemeSettingsValue = {
  themeId: ThemeId;
  /** Faux tant que le theme sauvegarde n'est pas lu (Night par defaut). */
  ready: boolean;
  setThemeId: (themeId: ThemeId) => void;
  /** Remet Night en memoire sans toucher au stockage (apres "Effacer les donnees"). */
  resetThemeId: () => void;
};

export const ThemeSettingsContext = createContext<ThemeSettingsValue>({
  themeId: 'night',
  ready: true,
  setThemeId: () => {},
  resetThemeId: () => {},
});

export const useThemeSettings = (): ThemeSettingsValue => useContext(ThemeSettingsContext);

export const useTheme = (): Theme => THEMES[useThemeSettings().themeId];

/**
 * Styles derives du theme courant. `createStyles` doit etre defini au niveau du module
 * (identite stable), sinon les styles sont recalcules a chaque rendu.
 */
export const useThemedStyles = <T>(createStyles: (theme: Theme) => T): T => {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
};
