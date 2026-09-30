import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

const SIZE = 32;

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    base: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      borderWidth: 2,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cross: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      lineHeight: fontSize.body + 2,
    },
    accent: {
      paddingHorizontal: spacing.xs,
    },
    crossAccent: {
      ...typography.heading,
      color: colors.title,
      fontSize: fontSize.title,
    },
  });
