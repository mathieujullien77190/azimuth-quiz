import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ typography }: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    text: {
      ...typography.heading,
      color: '#FFFFFF',
      fontSize: fontSize.body,
      textAlign: 'center',
    },
  });
