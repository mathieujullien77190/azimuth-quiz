import { StyleSheet } from 'react-native';
import { fontSize } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });
