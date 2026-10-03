import { StyleSheet } from 'react-native';

import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Everything but the ball itself is laid over the OpenGL surface, at the place the projection gives.
    wrap: {
      position: 'relative',
    },
    // The origin's name, centred above its dot: a line as wide as the drawing, so centring needs no measuring.
    label: {
      ...typography.heading,
      position: 'absolute',
      color: colors.text,
      fontSize: 12,
      textAlign: 'center',
    },
    poleLabel: {
      ...typography.heading,
      position: 'absolute',
      color: colors.text,
      fontSize: 11,
    },
    // Bottom right: zoom in, zoom out, and back to the opening view.
    controls: {
      position: 'absolute',
      right: spacing.xs,
      bottom: spacing.xs,
      flexDirection: 'row',
      gap: spacing.xs,
    },
    button: {
      minWidth: 28,
      height: 28,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: 13,
    },
    // The satellite sits on top of the drawing, its centre at the point given by `left`/`top`.
    satellite: {
      position: 'absolute',
      width: 20,
      height: 20,
    },
    satelliteEmoji: {
      width: 20,
      height: 20,
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
    // Above the satellite, centred on it.
    quipWrap: {
      position: 'absolute',
      left: -56,
      bottom: 24,
      width: 132,
    },
    quipBubble: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: 10,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
    },
    quipText: {
      ...typography.body,
      color: colors.accent,
      fontSize: 10,
      textAlign: 'center',
    },
  });
