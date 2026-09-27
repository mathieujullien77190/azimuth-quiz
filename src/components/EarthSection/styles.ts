import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginBottom: spacing.xs,
    },
    caption: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    zoomControls: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    zoomButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1,
      borderColor: colors.border,
    },
    zoomButtonLabel: {
      fontSize: fontSize.body,
      lineHeight: fontSize.body,
      color: colors.text,
      fontWeight: '700',
    },
    svgWrap: {
      position: 'relative',
    },
    // Sizeless anchor point at the center of the Earth: the rotation then translateY that
    // follow place the satellite in orbit, without affecting its own centering position.
    satelliteAnchor: {
      position: 'absolute',
      width: 0,
      height: 0,
    },
    satelliteEmoji: {
      width: 20,
      height: 20,
      marginLeft: -10,
      marginTop: -10,
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
      transform: [{ rotate: '-35deg' }],
    },
    // The plane glyph (✈️) points a different base direction than the satellite dish (🛰️): a
    // 90deg clockwise offset, tuned by eye, lines it up with its orbit instead of reusing
    // satelliteEmoji's -35deg (tuned for the satellite only).
    dayOrbitEmoji: {
      width: 20,
      height: 20,
      marginLeft: -10,
      marginTop: -10,
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
      transform: [{ rotate: '45deg' }],
    },
    // Counter-rotates relative to the orbit (see satelliteAngle) to stay legible regardless
    // of the satellite's angle at the moment of the click, rather than rotating with it.
    quipWrap: {
      position: 'absolute',
      left: 14,
      top: -14,
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
