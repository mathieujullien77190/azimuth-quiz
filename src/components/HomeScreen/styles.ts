import { StyleSheet } from 'react-native';
import { HOME_FOOTER_HEIGHT, spacing } from '@/data';
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
    // Sous le titre, comme le splash : la boussole au milieu de la place restante, le pied en bas.
    body: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      gap: spacing.md,
    },
    // Hauteur fixe: la barre de chargement (posee dessus) et les boutons ont la meme place, la boussole ne bouge pas.
    footer: {
      alignSelf: 'stretch',
      height: HOME_FOOTER_HEIGHT,
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
  });
