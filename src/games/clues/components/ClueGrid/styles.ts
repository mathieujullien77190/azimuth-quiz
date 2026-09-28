import { StyleSheet } from 'react-native';
import { spacing } from '@/data';

export const createStyles = () =>
  StyleSheet.create({
    clueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
  });
