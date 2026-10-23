import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, radius, typography, buttonDepth }: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 56,
      borderRadius: radius.button,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: colors.accent,
      borderBottomWidth: buttonDepth,
      borderBottomColor: colors.accentDark,
    },
    ghost: {
      // De nuit `surfaceHigh` est la couleur du panneau du footer (`GameFooter`) : le bouton secondaire s'y fondait,
      // le bleu de bordure (`#25334F`) s'en detache.
      backgroundColor: isDark ? colors.border : colors.surfaceHigh,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    pressed: {
      transform: [{ scale: 0.97 }],
      opacity: 0.9,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      ...typography.heading,
      fontSize: fontSize.subtitle,
      letterSpacing: 0.3,
    },
    labelPrimary: {
      color: colors.onAccent,
    },
    labelGhost: {
      color: colors.text,
    },
  });
