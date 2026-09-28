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
      fontSize: fontSize.caption + 1,
      color: colors.danger,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    // Round icon-only button, inline in the input row.
    hintFab: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    hintFabIcon: {
      fontSize: fontSize.subtitle,
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
