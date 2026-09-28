import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    // No separate header/footer bands reserving their own layout space — the board measures (and
    // fills) the entire safe area (see `fullBleedBoardArea`) and these two float on top of it
    // instead, so the country outline can run edge to edge behind them.
    fullBleedSafeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    fullBleedBoardArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Frames the board's exact drawable rectangle: no explicit width/height on purpose, so it
    // shrink-wraps ContourBoard's own `width` x `height` View exactly.
    boardFrame: {
      alignSelf: 'center',
    },
    // Positioning alone — the translucent floating-panel look itself lives in the shared
    // `GameHeader` (see `@/components/GameHeader`).
    overlayTopPosition: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    overlayBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? `${colors.surfaceHigh}F0` : `${colors.surface}F0`,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
  });
