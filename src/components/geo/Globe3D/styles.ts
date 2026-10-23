import { StyleSheet } from 'react-native';

import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Tout sauf la boule est pose sur la surface OpenGL, a l'endroit que donne la projection.
    wrap: {
      position: 'relative',
    },
    // Le nom de l'origine, centre au-dessus de sa pastille : une ligne aussi large que le dessin, donc aucun calcul de centrage.
    label: {
      ...typography.heading,
      position: 'absolute',
      color: colors.text,
      fontSize: 12,
      textAlign: 'center',
    },
    poleLabel: {
      ...typography.heading,
      position: 'absolute',
      color: colors.text,
      fontSize: 11,
    },
    // En bas a droite : zoom +, zoom −, et retour a la vue d'ouverture.
    controls: {
      position: 'absolute',
      right: spacing.xs,
      bottom: spacing.xs,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    button: {
      minWidth: 28,
      height: 28,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: 13,
    },
    // Le satellite est au-dessus du dessin, son centre au point donne par `left`/`top`.
    satellite: {
      position: 'absolute',
      width: 20,
      height: 20,
    },
    satelliteEmoji: {
      width: 20,
      height: 20,
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
    // Au-dessus du satellite, centre sur lui.
    quipWrap: {
      pointerEvents: 'none',
      position: 'absolute',
      left: -56,
      bottom: 24,
      width: 132,
    },
    quipBubble: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 10,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
    },
    quipText: {
      ...typography.body,
      color: colors.accent,
      fontSize: 10,
      textAlign: 'center',
    },
  });
