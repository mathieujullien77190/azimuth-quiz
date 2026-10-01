import { StyleSheet } from 'react-native';

import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    // The satellite sits on top of the drawing, its centre at the point given by `left`/`top`.
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
    // Above the satellite, centred on it.
    quipWrap: {
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
