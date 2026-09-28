import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      paddingVertical: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    label: {
      flex: 1.1,
    },
    name: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    cell: {
      flex: 1,
      gap: 2,
    },
    header: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    cellLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    cellText: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.caption + 1,
      flexShrink: 1,
    },
    cellDetail: {
      ...typography.body,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
  });
