import { StyleSheet } from 'react-native';
import { fontSize } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    text: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
  });
