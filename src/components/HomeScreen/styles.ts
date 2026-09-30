import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    mascotButton: {
      position: 'absolute',
      zIndex: 10,
      elevation: 10,
      top: spacing.sm,
      right: spacing.lg,
    },
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.display,
      letterSpacing: 6,
      textAlign: 'center',
    },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    games: {
      gap: spacing.md,
    },
  });
