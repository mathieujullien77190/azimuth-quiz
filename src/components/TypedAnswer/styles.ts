import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: spacing.xl,
      marginBottom: spacing.md,
    },
    word: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    slot: {
      width: 18,
      height: 26,
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    hyphen: {
      width: 12,
      height: 26,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    letter: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
  });
