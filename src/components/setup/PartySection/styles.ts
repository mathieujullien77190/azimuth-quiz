import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    names: {
      gap: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    // Input container: positions the initials within it, never as a sibling that could
    // push the row off-screen.
    inputWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    input: {
      ...typography.heading,
      minHeight: 44,
      paddingLeft: spacing.md,
      paddingRight: 46,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Same as `input`, but leaves room on the right for both the initials badge and the host's
    // "Kick" mini button next to it (see `removeButton`), instead of just the badge.
    inputWithRemove: {
      paddingRight: 128,
    },
    initials: {
      position: 'absolute',
      right: spacing.xs + 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    initialsText: {
      ...typography.label,
      fontSize: fontSize.caption,
    },
    // Sits just left of `initials` (same absolute-right positioning scheme), inside the same
    // input box, rather than as a separate element outside it.
    removeButton: {
      position: 'absolute',
      right: spacing.xs + 2 + 28 + spacing.sm,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    error: {
      ...typography.body,
      color: colors.danger,
      fontSize: fontSize.caption + 1,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    coordInput: {
      ...typography.heading,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });
