import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, card }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: card.borderWidth,
      borderColor: colors.border,
      padding: spacing.md,
      ...(card.shadowColor !== null && {
        shadowColor: card.shadowColor,
        shadowOpacity: card.shadowOpacity,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }),
    },
  });
