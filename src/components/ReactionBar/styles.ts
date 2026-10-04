import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { MIN_TOUCH_SIZE, TOGGLE_SIZE } from './constants';

export const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    // Floats just above the footer it is a child of (`bottom: '100%'` of it), at its right corner: out of the footer's
    // flow, so the footer's own buttons keep their layout and width, and above them, never over them. The column hangs
    // off it (see `column`).
    bar: {
      position: 'absolute',
      bottom: '100%',
      right: spacing.sm,
      marginBottom: spacing.xs,
      alignItems: 'flex-end',
    },
    toggle: {
      width: TOGGLE_SIZE,
      height: TOGGLE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: TOGGLE_SIZE / 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toggleEmoji: {
      fontSize: fontSize.subtitle + 6,
    },
    // Opens upward from the round button, stacked above it and flush against the right edge of the screen (the
    // button's own margin is taken back).
    column: {
      position: 'absolute',
      bottom: '100%',
      marginBottom: spacing.xs,
      right: -spacing.sm,
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
      borderWidth: 1,
      borderRightWidth: 0,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    button: {
      minWidth: MIN_TOUCH_SIZE,
      minHeight: MIN_TOUCH_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: MIN_TOUCH_SIZE / 2,
    },
    emoji: {
      fontSize: fontSize.subtitle + 8,
    },
  });
