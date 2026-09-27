import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';
import { DOT_SIZE } from './constants';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm + 4,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      borderWidth: 2,
    },
    check: {
      color: colors.onAccent,
      fontSize: 8,
      fontWeight: '700',
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.caption + 1,
    },
  });
