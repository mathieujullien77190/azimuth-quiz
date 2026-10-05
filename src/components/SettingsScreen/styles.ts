import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.title,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    about: {
      gap: spacing.sm,
    },
    aboutLine: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    input: {
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
    // The dev code, under the about section: just the word "code" and its field, nothing to explain it.
    devRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    devInput: {
      flex: 1,
    },
    version: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      // The label style is upper case: the version line reads as the splash's does, "v2.64.1 - 🦥 - brown-throated-sloth".
      textTransform: 'none',
    },
  });
