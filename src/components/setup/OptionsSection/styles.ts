import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    coordRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    coordField: {
      flex: 1,
      gap: spacing.xs,
    },
    coordLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    coordInput: {
      ...typography.heading,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });
