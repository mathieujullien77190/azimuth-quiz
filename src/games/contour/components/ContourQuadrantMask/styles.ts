import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { FLAG_MARKER_OPACITY, FLAG_MARKER_RADIUS } from './constants';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    // Laid over the board it hides, in its exact rectangle (see `ContourFullBleedScreen`'s `boardOverlay`).
    mask: {
      ...StyleSheet.absoluteFill,
    },
    // Fully opaque, in the screen's own background colour and with no outline: nothing of the board may show through,
    // and a hidden cell does not read as a square, only as empty space with its lock and its cost.
    cell: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.background,
    },
    // A flag hidden behind a locked cell: a plain accent rectangle, same box as the flag, above the cell. Touches go
    // through it (the cell below can still be tapped).
    flagMarker: {
      position: 'absolute',
      backgroundColor: colors.accent,
      borderRadius: FLAG_MARKER_RADIUS,
      opacity: FLAG_MARKER_OPACITY,
    },
    lock: {
      fontSize: fontSize.title,
    },
    cost: {
      ...typography.label,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
  });
