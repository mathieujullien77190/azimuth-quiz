import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    // Same size as running text elsewhere (e.g. SettingsScreen's about lines, also fontSize.body):
    // typography.heading's bold weight made it read smaller than that at a glance, hence the
    // explicit match here rather than leaving it implicit.
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    disabled: {
      opacity: 0.5,
    },
  });
