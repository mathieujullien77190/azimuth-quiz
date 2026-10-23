import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Petite pilule : contour, surface quasi transparente. Seuls la bordure et la couleur du texte la distinguent.
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
