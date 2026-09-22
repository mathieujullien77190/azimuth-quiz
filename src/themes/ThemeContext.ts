import { useMemo } from 'react';

import type { Theme } from '@/types';

import { night } from './night';

/** Un seul theme (Nuit) pour l'instant : pas de contexte a fournir. */
export const useTheme = (): Theme => night;

/**
 * Styles derives du theme courant. `createStyles` doit etre defini au niveau du module
 * (identite stable), sinon les styles sont recalcules a chaque rendu.
 */
export const useThemedStyles = <T>(createStyles: (theme: Theme) => T): T => {
  const theme = useTheme();
  return useMemo(() => createStyles(theme), [createStyles, theme]);
};
