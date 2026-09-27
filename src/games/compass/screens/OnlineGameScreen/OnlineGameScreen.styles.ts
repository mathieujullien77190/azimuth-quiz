import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    // Same fixed near-black backdrop as SetupScreen's own disconnect notice (not a themed one):
    // reads the same in both themes, and this is the one screen where the theme itself might be
    // about to disappear from under it.
    noticeOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    noticeText: {
      ...typography.heading,
      color: '#FFFFFF',
      fontSize: fontSize.body,
      textAlign: 'center',
    },
  });
