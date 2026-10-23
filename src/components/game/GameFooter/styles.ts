import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    // Look de panneau flottant, comme `GameHeader` : `surfaceHigh`/`surface` a ~94 % d'opacite (`F0`) donne un
    // panneau releve dans les deux themes, assez translucide pour ne pas faire barre pleine.
    footer: {
      backgroundColor: isDark ? `${colors.surfaceHigh}F0` : `${colors.surface}F0`,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
  });
