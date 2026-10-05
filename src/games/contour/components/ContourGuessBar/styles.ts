import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    bar: {
      gap: spacing.sm + 2,
    },
    wrongText: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.subtitle,
      color: colors.danger,
    },
    lockedText: {
      ...typography.body,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
      color: colors.textMuted,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.caption + 1,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      ...typography.heading,
      flex: 1,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });
