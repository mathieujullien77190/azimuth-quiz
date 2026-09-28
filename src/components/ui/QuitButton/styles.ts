import { StyleSheet } from 'react-native';
import { fontSize } from '@/data';
import type { Theme } from '@/types';

const SIZE = 32;

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    circle: {
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
  });
