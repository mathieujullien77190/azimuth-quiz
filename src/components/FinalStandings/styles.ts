import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
      textAlign: 'center',
    },
    banner: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    hero: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    heroEmoji: {
      fontSize: 56,
    },
    heroTitle: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      textAlign: 'center',
    },
    heroScore: {
      ...typography.display,
      color: colors.text,
      fontSize: 64,
      marginTop: spacing.sm,
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
    rank: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
      width: 32,
      textAlign: 'center',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    name: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      flex: 1,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
    },
    recapTitle: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      paddingVertical: spacing.xs,
    },
    recapLabel: {
      flex: 1.1,
    },
    recapCell: {
      flex: 1,
      gap: 2,
    },
    recapHeader: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    cellLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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
