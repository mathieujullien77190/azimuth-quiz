import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Small pill: outlined, transparent-ish surface. Only the border and text color tell the
    // variants apart.
    button: {
      alignSelf: 'center',
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radius.button,
      borderWidth: 1.5,
      backgroundColor: colors.surfaceHigh,
    },
    accent: {
      borderColor: colors.accent,
    },
    danger: {
      borderColor: colors.danger,
    },
    label: {
      ...typography.label,
      fontSize: fontSize.caption,
    },
    labelAccent: {
      color: colors.accent,
    },
    labelDanger: {
      color: colors.danger,
    },
  });
