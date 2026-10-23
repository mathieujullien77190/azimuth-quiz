import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
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
    version: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      // Le style du libelle est en majuscules : la ligne de version se lit comme celle du splash, « v2.64.1 - 🦥 - brown-throated-sloth ».
      textTransform: 'none',
    },
  });
