import { memo } from 'react';
import Svg, { Circle, G, Polygon } from 'react-native-svg';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import { CompassFace } from './CompassFace';
import { KNOB_RADIUS_RATIO, NEEDLE_HALF_WIDTH_RATIO, NEEDLE_LENGTH_RATIO, NEEDLE_TAIL_RATIO } from './constants';
import { needlePoints, polarToPoint } from './helpers';
import type { CompassDialProps } from './types';

/**
 * Le dessin de la compass (cadran + aiguilles), oriente nord en haut.
 * Memoise : quand le capteur fait tourner le cadran, seul le conteneur change.
 * Le cadran statique (graduations, lettres cardinales) est isole dans `CompassFace`, memoise
 * separement sur des props qui ne changent pas pendant un drag — voir ce fichier.
 */
export const CompassDial = memo(function CompassDial({ size, needles, truthBearing }: CompassDialProps) {
  const { colors, typography } = useTheme();
  const t = useTranslation();
  const center = size / 2;
  const radius = size / 2;

  const needleLength = radius * NEEDLE_LENGTH_RATIO;
  const needleTail = radius * NEEDLE_TAIL_RATIO;
  const needleHalfWidth = radius * NEEDLE_HALF_WIDTH_RATIO;
  const knobRadius = radius * KNOB_RADIUS_RATIO;

  // The solution is a needle like any other — same shape, same size, only its color (`colors.truth`)
  // differs — and comes last so it is drawn on top of every player needle, never partly hidden
  // under an overlapping one.
  const drawnNeedles = truthBearing === null ? needles : [...needles, { bearing: truthBearing, color: colors.truth }];

  return (
    <Svg width={size} height={size}>
      <CompassFace colors={colors} size={size} typography={typography} westLabel={t.compassWestLabel} />

      {drawnNeedles.map((needle, index) => (
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

      <Circle cx={center} cy={center} r={size * 0.03} fill={colors.background} stroke={colors.text} strokeWidth={2} />
    </Svg>
  );
});
