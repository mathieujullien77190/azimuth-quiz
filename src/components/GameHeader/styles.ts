import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
    // A floating-panel look, adopted here for every game's header rather than each one
    // picking its own bar color: `surfaceHigh`/`surface` at ~94% opacity (`F0`) reads as a raised
    // panel in both themes, translucent enough to stay legible without looking like a fully solid
    // bar.
    header: {
      backgroundColor: isDark ? `${colors.surfaceHigh}F0` : `${colors.surface}F0`,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    // The cross and, right next to it, the room code.
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    code: {
      ...typography.label,
      color: colors.text,
      fontSize: fontSize.body + 2,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body + 2,
    },
    // "Manche 3 / 10 · 🟡 Moyen", one line aligned left.
    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    separator: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    // Travel mode: where the player stands, in white, aligned left like the round row.
    location: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body + 2,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
  });
