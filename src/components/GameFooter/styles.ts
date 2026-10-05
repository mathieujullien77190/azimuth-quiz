import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    // A floating-panel look, adopted for every game's footer (like `GameHeader`, at the
    // other end of the screen): `surfaceHigh`/`surface` at ~94% opacity (`F0`) reads as a raised
    // panel in both themes, translucent enough to stay legible without looking like a solid bar.
    footer: {
      backgroundColor: isDark ? `${colors.surfaceHigh}F0` : `${colors.surface}F0`,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
  });
