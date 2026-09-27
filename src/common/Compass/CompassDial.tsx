import { memo } from 'react';
import Svg, { Circle, G, Polygon } from 'react-native-svg';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import { CompassFace } from './CompassFace';
import { KNOB_RADIUS_RATIO, NEEDLE_HALF_WIDTH_RATIO, NEEDLE_LENGTH_RATIO, NEEDLE_TAIL_RATIO } from './constants';
import { needlePoints, polarToPoint } from './helpers';
import type { CompassDialProps } from './types';

/**
 * Le dessin de la boussole (cadran + aiguilles), oriente nord en haut.
 * Memoise : quand le capteur fait tourner le cadran, seul le conteneur change.
 * Le cadran statique (graduations, lettres cardinales) est isole dans `CompassFace`, memoise
 * separement sur des props qui ne changent pas pendant un drag — voir ce fichier.
 */
export const CompassDial = memo(function CompassDial({
  size,
  bearing,
  color,
  extraNeedles,
  truthBearing,
}: CompassDialProps) {
  const { colors, typography } = useTheme();
  const t = useTranslation();
  const center = size / 2;
  const radius = size / 2;

  const needleLength = radius * NEEDLE_LENGTH_RATIO;
  const needleTail = radius * NEEDLE_TAIL_RATIO;
  const needleHalfWidth = radius * NEEDLE_HALF_WIDTH_RATIO;
  const knobRadius = radius * KNOB_RADIUS_RATIO;

  return (
    <Svg width={size} height={size}>
      <CompassFace colors={colors} size={size} typography={typography} westLabel={t.compassWestLabel} />

      {extraNeedles.map((needle, index) => (
        <G key={index}>
          <Polygon
            points={needlePoints(center, needle.bearing, needleLength, needleTail, needleHalfWidth)}
            fill={needle.color}
            opacity={0.85}
          />
          <Circle
            cx={polarToPoint(center, knobRadius, needle.bearing).x}
            cy={polarToPoint(center, knobRadius, needle.bearing).y}
            r={size * 0.034}
            fill={needle.color}
            stroke={colors.background}
            strokeWidth={2}
          />
        </G>
      ))}

      {bearing !== null && (
        <>
          <Polygon
            points={needlePoints(center, bearing, needleLength, needleTail, needleHalfWidth)}
            fill={color ?? colors.accent}
          />
          <Circle
            cx={polarToPoint(center, knobRadius, bearing).x}
            cy={polarToPoint(center, knobRadius, bearing).y}
            r={size * 0.04}
            fill={color ?? colors.accent}
            stroke={colors.background}
            strokeWidth={3}
          />
        </>
      )}

      {/* Drawn last (on top of every player needle, including this player's own): the solution
          must always read clearly, never partly hidden under an overlapping player knob. Its own
          knob is the biggest of all three knob sizes (0.045 vs the player's own 0.04 and an extra
          needle's 0.034) so it fully covers one underneath rather than leaving a colored ring
          peeking out around a smaller yellow center. */}
      {truthBearing !== null && (
        <>
          <Polygon
            points={needlePoints(center, truthBearing, needleLength, needleTail, needleHalfWidth)}
            fill={colors.truth}
            opacity={0.9}
          />
          <Circle
            cx={polarToPoint(center, knobRadius, truthBearing).x}
            cy={polarToPoint(center, knobRadius, truthBearing).y}
            r={size * 0.045}
            fill={colors.truth}
            stroke={colors.background}
            strokeWidth={2}
          />
        </>
      )}

      <Circle cx={center} cy={center} r={size * 0.03} fill={colors.background} stroke={colors.text} strokeWidth={2} />
    </Svg>
  );
});
