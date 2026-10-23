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
    // Code dev sous la section a propos : juste le mot « code » et son champ, rien a expliquer.
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
      // Le style du libelle est en majuscules : la ligne de version se lit comme celle du splash, « v2.64.1 - 🦥 - brown-throated-sloth ».
      textTransform: 'none',
    },
  });
