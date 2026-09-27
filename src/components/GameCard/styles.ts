import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm + 2,
    },
    disabled: {
      opacity: 0.55,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 22,
    },
    title: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
      flexShrink: 1,
    },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body - 1,
      lineHeight: 19,
    },
    meta: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption - 2,
    },
    note: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });
