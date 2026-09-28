import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

// Same "loading" convention as GameScreen/OnlineGameScreen's own early-loading screens: the gap
// between pressing "Lancer la partie" (GPS resolution, then a Firestore write/round-trip before
// `roomScreen` flips) used to pass with no feedback at all.
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
  });
