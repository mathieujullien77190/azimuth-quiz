import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Without this, the horizontal ScrollView stretches to fill the Screen's remaining height.
    scroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm + 2,
    },
    rowCompact: {
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.sm - 1,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    tabCompact: {
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 3,
    },
    active: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    locked: {
      opacity: 0.5,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotCompact: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body - 1,
    },
    labelCompact: {
      fontSize: fontSize.body - 1,
    },
    labelActive: {
      color: colors.onAccent,
    },
    check: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.body - 1,
    },
    checkCompact: {
      fontSize: fontSize.body - 1,
    },
    checkActive: {
      color: colors.onAccent,
    },
  });
