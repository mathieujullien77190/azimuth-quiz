import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    mascotButton: {
      position: 'absolute',
      zIndex: 10,
      elevation: 10,
      top: spacing.sm,
      right: spacing.lg,
    },
    // Les deux grandes cartes, empilees et poussees en BAS de l'ecran (le bloc titre reste en haut, ou le splash le
    // dessine aussi) : la hauteur libre est entre eux. Zone de securite basse et padding du Screen comme pour tout ecran.
    games: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      gap: spacing.lg,
    },
  });
