import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    hero: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    rankEmoji: {
      fontSize: 56,
    },
    rankTitle: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      textAlign: 'center',
    },
    score: {
      ...typography.display,
      color: colors.text,
      fontSize: 64,
      marginTop: spacing.sm,
    },
    list: {
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    medal: {
      fontSize: 28,
      width: 36,
      textAlign: 'center',
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    rowText: {
      flex: 1,
    },
    name: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    detail: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    rowScore: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
  });
