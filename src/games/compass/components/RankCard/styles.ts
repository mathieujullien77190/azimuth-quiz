import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emoji: {
      fontSize: 56,
    },
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      textAlign: 'center',
    },
    score: {
      ...typography.display,
      color: colors.text,
      fontSize: 64,
      marginTop: spacing.sm,
    },
  });
