import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    stat: {
      flex: 1,
      backgroundColor: colors.surfaceHigh,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    value: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
      marginTop: 2,
    },
  });
