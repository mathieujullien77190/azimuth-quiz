import { StyleSheet } from 'react-native';
import { spacing } from '@/data';

export const createStyles = () =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    stepFlex: {
      flex: 1,
    },
    validateFlex: {
      flex: 1,
    },
  });
