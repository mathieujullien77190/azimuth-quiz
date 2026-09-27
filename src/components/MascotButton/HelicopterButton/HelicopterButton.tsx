import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/themes';

import { COCKPIT_COLOR, COCKPIT_HIGHLIGHT_COLOR, SIZE, TICK_MS } from './constants';
import { helicopterIdleFrame } from './helpers';
import type { HelicopterButtonProps } from './types';

/**
 * Bouton d'acces aux reglages, en forme d'helicoptere qui flotte doucement sur place (rotor
 * principal qui tourne en continu, feu anticollision qui clignote a l'arriere).
 */
export const HelicopterButton = ({ onPress, accessibilityLabel }: HelicopterButtonProps) => {
  const { colors } = useTheme();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const { bobY, rotorAngleDeg, blinkOpacity } = helicopterIdleFrame(elapsedMs);

  const bodyRx = SIZE * 0.25;
  const bodyRy = SIZE * 0.175;
  const mastLength = SIZE * 0.23;
  const rotorTopY = -(bodyRy + mastLength);
  const rotorRx = SIZE * 0.45;
  const tailStartX = bodyRx * 0.8;
  const tailLength = SIZE * 0.25;
  const tailWidth = SIZE * 0.06;
  const tailRotorR = SIZE * 0.055;
  const skidY = bodyRy + SIZE * 0.08;

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" hitSlop={12} onPress={onPress}>
      <Svg height={SIZE * 1.5} width={SIZE}>
        <G transform={`translate(${SIZE / 2} ${SIZE * 0.75 + bobY})`}>
          {/* Skids. */}
          <Line stroke={colors.textMuted} strokeWidth={1.5} x1={-bodyRx * 0.75} x2={bodyRx * 0.6} y1={skidY} y2={skidY} />
          <Line stroke={colors.textMuted} strokeWidth={1.2} x1={-bodyRx * 0.55} x2={-bodyRx * 0.55} y1={bodyRy} y2={skidY} />
          <Line stroke={colors.textMuted} strokeWidth={1.2} x1={bodyRx * 0.35} x2={bodyRx * 0.35} y1={bodyRy} y2={skidY} />

          {/* Tail boom + rotor + anti-collision light. */}
          <Rect fill={colors.text} height={tailWidth} rx={tailWidth / 2} width={tailLength} x={tailStartX} y={-tailWidth / 2} />
          <Circle cx={tailStartX + tailLength} cy={0} fill="none" r={tailRotorR} stroke={colors.text} strokeWidth={1} />
          <Circle cx={tailStartX + tailLength} cy={0} fill={colors.danger} opacity={blinkOpacity} r={1.4} />

          {/* Fuselage + cockpit bubble. */}
          <Ellipse cx={0} cy={0} fill={colors.text} rx={bodyRx} ry={bodyRy} />
          <Circle cx={-bodyRx * 0.55} cy={-bodyRy * 0.1} fill={COCKPIT_COLOR} opacity={0.8} r={bodyRy * 0.85} />
          <Circle cx={-bodyRx * 0.7} cy={-bodyRy * 0.4} fill={COCKPIT_HIGHLIGHT_COLOR} opacity={0.5} r={bodyRy * 0.22} />

          {/* Mast + spinning main rotor. */}
          <Line stroke={colors.text} strokeWidth={1.5} x1={0} x2={0} y1={-bodyRy} y2={rotorTopY} />
          <Circle cx={0} cy={rotorTopY} fill={colors.text} r={1.8} />
          <G transform={`rotate(${rotorAngleDeg} 0 ${rotorTopY})`}>
            <Ellipse cx={0} cy={rotorTopY} fill={colors.text} opacity={0.85} rx={rotorRx} ry={1.4} />
          </G>
        </G>
      </Svg>
    </Pressable>
  );
};
