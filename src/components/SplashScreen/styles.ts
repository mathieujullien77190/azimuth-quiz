import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { DIAL_SIZE } from './constants';

export const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
    screen: {
      ...StyleSheet.absoluteFill,
      zIndex: 1000,
      backgroundColor: colors.background,
    },
    // The same padding as a `Screen` (safe area + its content padding), so that the title block, drawn first, sits at
    // exactly the position it has on the home screen.
    layout: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    // What is under the title: the dial in the middle of the room left, the footer at the bottom.
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      gap: spacing.md,
    },
    dial: {
      width: DIAL_SIZE,
      height: DIAL_SIZE,
    },
    needle: {
      ...StyleSheet.absoluteFill,
    },
    footer: {
      alignSelf: 'stretch',
      alignItems: 'center',
      gap: spacing.md,
    },
    track: {
      alignSelf: 'stretch',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    fill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: isDark ? colors.accent : colors.accentDark,
    },
    // The "loading" label and, beside it, the bar's percentage.
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    loading: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      letterSpacing: 3,
    },
    // The whole version line, never cut: centred, readable, and free to wrap onto a second line on a narrow phone.
    version: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
      alignSelf: 'stretch',
    },
  });
