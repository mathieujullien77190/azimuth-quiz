import { memo } from 'react';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import {
  FACE_RADIUS_RATIO,
  KNOB_RADIUS_RATIO,
  LABEL_RADIUS_RATIO,
  NEEDLE_HALF_WIDTH_RATIO,
  NEEDLE_LENGTH_RATIO,
  NEEDLE_TAIL_RATIO,
} from './constants';
import { buildTicks, cardinalPoints, needlePoints, polarToPoint } from './helpers';
import type { CompassDialProps } from './types';

/**
 * Le dessin de la boussole (cadran + aiguilles), oriente nord en haut.
 * Memoise : quand le capteur fait tourner le cadran, seul le conteneur change.
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
  const points = cardinalPoints(t.compassWestLabel);
  const tickStyle = {
    cardinal: { stroke: colors.text, width: 2.5 },
    intercardinal: { stroke: colors.textMuted, width: 2 },
    minor: { stroke: colors.border, width: 1.5 },
  } as const;
  const center = size / 2;
  const radius = size / 2;
  const ticks = buildTicks(size);

  const needleLength = radius * NEEDLE_LENGTH_RATIO;
  const needleTail = radius * NEEDLE_TAIL_RATIO;
  const needleHalfWidth = radius * NEEDLE_HALF_WIDTH_RATIO;
  const knobRadius = radius * KNOB_RADIUS_RATIO;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius * FACE_RADIUS_RATIO}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={3}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius * 0.5}
        fill="none"
        stroke={colors.border}
        strokeWidth={1}
        strokeDasharray="3 6"
      />

      {ticks.map(({ key, from, to, kind }) => (
        <Line
          key={key}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={tickStyle[kind].stroke}
          strokeWidth={tickStyle[kind].width}
          strokeLinecap="round"
        />
      ))}

      {points.map(({ label, bearing: labelBearing }) => {
        const { x, y } = polarToPoint(center, radius * LABEL_RADIUS_RATIO, labelBearing);
        const fontSize = size * 0.09;
        return (
          <SvgText
            key={label}
            x={x}
            y={y + fontSize * 0.35}
            fill={label === 'N' ? colors.danger : colors.textMuted}
            fontSize={fontSize}
            fontFamily={typography.heading.fontFamily}
            fontWeight="800"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}

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
            r={size * 0.028}
            fill={colors.truth}
          />
        </>
      )}

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

      <Circle cx={center} cy={center} r={size * 0.03} fill={colors.background} stroke={colors.text} strokeWidth={2} />
    </Svg>
  );
});
