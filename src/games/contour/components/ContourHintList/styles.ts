import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    list: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs + 2,
    },
    // The three groups side by side; the country, once it is offered, on a row of its own.
    card: {
      flexGrow: 1,
      flexBasis: '30%',
      gap: 2,
    },
    cardWide: {
      flexBasis: '100%',
    },
    title: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption - 1,
    },
    step: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
    },
    stepDisabled: {
      opacity: 0.5,
    },
    stepText: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
    done: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      textAlign: 'center',
      paddingVertical: spacing.xs,
    },
  });
