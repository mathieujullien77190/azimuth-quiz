import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm + 1,
      borderRadius: radius.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    selected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    label: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body - 1,
    },
    labelSelected: {
      color: colors.onAccent,
    },
    disabled: {
      opacity: 0.5,
    },
  });
