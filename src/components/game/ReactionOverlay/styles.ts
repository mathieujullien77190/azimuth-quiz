import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    overlay: {
      pointerEvents: 'none',
      ...StyleSheet.absoluteFill,
    },
    // Une bulle : posee en bas au milieu de l'overlay, puis portee vers le haut par son propre transform.
    bubble: {
      pointerEvents: 'none',
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    card: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    emoji: {
      fontSize: fontSize.display + 8,
    },
    name: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: `${colors.surfaceHigh}E6`,
    },
  });
