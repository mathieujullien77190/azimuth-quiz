import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    // Same "loading" convention as GameScreen/OnlineGameScreen's own early-loading screens: the
    // gap between pressing "Lancer la partie" (GPS resolution, then a Firestore write/round-trip
    // before `roomScreen` flips) used to pass with no feedback at all.
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
