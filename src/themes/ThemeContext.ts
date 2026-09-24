import { createContext, useContext, useMemo } from 'react';

import type { Theme, ThemeId } from '@/types';

import { day } from './day';
import { night } from './night';

export const THEMES: Record<ThemeId, Theme> = { night, day };

export type ThemeSettingsValue = {
  themeId: ThemeId;
  /** False until the saved theme has been read (Night is returned by default until then). */
  ready: boolean;
  setThemeId: (themeId: ThemeId) => void;
  /** Resets the in-memory theme to Night by default, without rewriting storage
   * (used after "Clear data": otherwise the app keeps the theme in memory until the next
   * launch, even though storage is already empty). */
  resetThemeId: () => void;
  /** Home screen mascot roaming + starry/cloudy backdrop drift: off by default (some devices
   * stutter on them). Not really "theme" but shares the same persisted-display-setting plumbing
   * (see `ThemeProvider`), so it rides along here rather than a whole separate context. */
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  /** Same idea as `resetThemeId`, for "Clear data". */
  resetAnimationsEnabled: () => void;
};

export const ThemeSettingsContext = createContext<ThemeSettingsValue>({
  themeId: 'night',
  ready: true,
  setThemeId: () => {},
  resetThemeId: () => {},
  animationsEnabled: false,
  setAnimationsEnabled: () => {},
  resetAnimationsEnabled: () => {},
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
