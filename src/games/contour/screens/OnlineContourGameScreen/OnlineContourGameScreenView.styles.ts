import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    footer: {
      gap: spacing.sm + 2,
    },
    pointsAtStake: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    waiting: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    banner: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
  });
