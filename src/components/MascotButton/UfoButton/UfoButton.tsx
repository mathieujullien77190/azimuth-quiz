import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { useTheme } from '@/themes';

import { GearIcon } from '../GearIcon';

import {
  CONE_BOTTOM_RATIO,
  CONE_GRADIENT_ID,
  CONE_OPACITY,
  CONE_TOP_RATIO,
  DOME_COLOR,
  DOME_HIGHLIGHT_COLOR,
  GEAR_OFFSET_Y,
  SIZE,
  TICK_MS,
} from './constants';
import { ufoIdleFrame } from './helpers';
import type { UfoButtonProps } from './types';

/**
 * Bouton d'acces aux reglages, en forme de soucoupe volante qui flotte doucement sur place
 * (feux du pourtour qui clignotent). Un cone de lumiere part de dessous, et un engrenage qui tourne
 * en continu (le symbole des reglages) flotte juste en dessous, dans le faisceau.
 */
export const UfoButton = ({ onPress, accessibilityLabel }: UfoButtonProps) => {
  const { colors } = useTheme();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const { bobY, blinkOpacityA, blinkOpacityB, gearDeg } = ufoIdleFrame(elapsedMs);
  const rimRx = SIZE / 2;
  const rimRy = SIZE / 7;
  // In the group's local frame (origin = the saucer's center): the beam starts under the rim and
  // widens down past the gear, fading out to nothing at the bottom, and the gear sits in it.
  const coneTop = rimRy * 2;
  const gearY = coneTop + SIZE * GEAR_OFFSET_Y;
  const gearR = SIZE * 0.17;

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" hitSlop={12} onPress={onPress}>
      <Svg height={SIZE * 1.75} width={SIZE}>
        <G transform={`translate(${SIZE / 2} ${SIZE * 0.4 + bobY})`}>
          <Defs>
            <LinearGradient id={CONE_GRADIENT_ID} x1={0} x2={0} y1={0} y2={1}>
              <Stop offset={0} stopColor={DOME_COLOR} stopOpacity={CONE_OPACITY} />
              <Stop offset={1} stopColor={DOME_COLOR} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Polygon
            fill={`url(#${CONE_GRADIENT_ID})`}
            points={`${-rimRx * CONE_TOP_RATIO},${coneTop} ${rimRx * CONE_TOP_RATIO},${coneTop} ${rimRx * CONE_BOTTOM_RATIO},${gearY + gearR * 1.5} ${-rimRx * CONE_BOTTOM_RATIO},${gearY + gearR * 1.5}`}
          />
          <Ellipse cx={0} cy={rimRy} fill={colors.textMuted} opacity={0.35} rx={rimRx * 1.15} ry={rimRy * 1.6} />
          <Circle cx={0} cy={-rimRy * 0.6} fill={DOME_COLOR} opacity={0.75} r={rimRx * 0.42} />
          <Circle cx={-rimRx * 0.11} cy={-rimRy * 1.3} fill={DOME_HIGHLIGHT_COLOR} opacity={0.5} r={rimRx * 0.11} />
          <Ellipse cx={0} cy={rimRy} fill={colors.text} rx={rimRx} ry={rimRy} />
          {[-0.6, -0.2, 0.2, 0.6].map((ratio, index) => (
            <Circle
              key={ratio}
              cx={rimRx * ratio}
              cy={rimRy * 1.4}
              fill={colors.accent}
              opacity={index % 2 === 0 ? blinkOpacityA : blinkOpacityB}
              r={2}
            />
          ))}
          <G transform={`translate(0 ${gearY})`}>
            <GearIcon angleDeg={gearDeg} color={colors.accent} radius={gearR * 1.67} />
          </G>
        </G>
      </Svg>
    </Pressable>
  );
};
