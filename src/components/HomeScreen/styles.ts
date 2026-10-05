import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    mascotButton: {
      position: 'absolute',
      zIndex: 10,
      elevation: 10,
      top: spacing.sm,
      right: spacing.lg,
    },
    games: {
      gap: spacing.md,
    },
  });
