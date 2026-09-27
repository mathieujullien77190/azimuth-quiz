import { memo, useMemo } from 'react';
import { Circle, Line, Text as SvgText } from 'react-native-svg';

import { LABEL_RADIUS_RATIO, FACE_RADIUS_RATIO } from './constants';
import { buildTicks, cardinalPoints, polarToPoint } from './helpers';
import type { CompassFaceProps } from './types';

/**
 * The dial's static geometry: background circle, ticks, cardinal labels — everything that
 * doesn't depend on `bearing`. Memoized (and its own `useMemo` on top, belt-and-suspenders) so
 * dragging the needle (see `Compass.tsx`) doesn't rebuild these 72 ticks + 4 labels every frame.
 */
export const CompassFace = memo(function CompassFace({ size, colors, typography, westLabel }: CompassFaceProps) {
  const center = size / 2;
  const radius = size / 2;
  const ticks = useMemo(() => buildTicks(size), [size]);
  const points = useMemo(() => cardinalPoints(westLabel), [westLabel]);
  const tickStyle = {
    cardinal: { stroke: colors.text, width: 2.5 },
    intercardinal: { stroke: colors.textMuted, width: 2 },
    minor: { stroke: colors.border, width: 1.5 },
  } as const;

  return (
    <>
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
    </>
  );
});
