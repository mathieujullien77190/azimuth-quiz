import type { Theme, ThemeMode } from '@/types';

import { night } from './night';
import { paper } from './paper';

export { ThemeContext, useTheme, useThemeSwitcher, useThemedStyles } from './ThemeContext';

export { night, paper };

/** Sombre = Nuit, clair = Papier. */
export const themeForMode = (mode: ThemeMode, systemScheme: string | null | undefined): Theme => {
  if (mode === 'dark') return night;
  if (mode === 'light') return paper;
  return systemScheme === 'light' ? paper : night;
};
