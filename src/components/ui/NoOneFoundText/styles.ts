import { StyleSheet } from 'react-native';
import { fontSize } from '@/data';
import type { Theme } from '@/types';

/** Silhouette's winner banner and this line, when `large`, are the same size: one number so they cannot drift apart. */
export const FOUND_BANNER_FONT_SIZE = fontSize.title - 4;

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    text: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    large: {
      fontSize: FOUND_BANNER_FONT_SIZE,
    },
  });
