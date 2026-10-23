import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    name: {
      ...typography.display,
      color: colors.text,
      fontSize: fontSize.display,
      maxWidth: '100%',
      textAlign: 'center',
    },
    country: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    wikiBadge: {
      marginTop: spacing.sm,
      minHeight: 24,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wikiBadgeText: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
  });
