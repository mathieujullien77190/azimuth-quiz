import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });
