import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon } from 'react-native-svg';

import { useTheme } from '@/themes';

import { CONE_OPACITY, DOME_COLOR, DOME_HIGHLIGHT_COLOR, SIZE, TICK_MS } from './constants';
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
  // widens down to the gear, which sits in it.
  const coneTop = rimRy * 2;
  const gearY = coneTop + SIZE * 0.42;
  const gearR = SIZE * 0.17;

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" hitSlop={12} onPress={onPress}>
      <Svg height={SIZE * 1.75} width={SIZE}>
        <G transform={`translate(${SIZE / 2} ${SIZE * 0.4 + bobY})`}>
          <Polygon
            fill={DOME_COLOR}
            opacity={CONE_OPACITY}
            points={`${-rimRx * 0.32},${coneTop} ${rimRx * 0.32},${coneTop} ${rimRx * 0.85},${gearY + gearR * 1.5} ${-rimRx * 0.85},${gearY + gearR * 1.5}`}
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
          {/* Gear: a dashed ring gives the teeth, turning around its own center. */}
          <G transform={`translate(0 ${gearY}) rotate(${gearDeg})`}>
            <Circle cx={0} cy={0} fill="none" r={gearR} stroke={colors.accent} strokeDasharray="3.1 3.1" strokeWidth={gearR * 0.7} />
            <Circle cx={0} cy={0} fill="none" r={gearR * 0.72} stroke={colors.accent} strokeWidth={2} />
          </G>
        </G>
      </Svg>
    </Pressable>
  );
};
