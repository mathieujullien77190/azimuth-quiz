import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { useTheme } from '@/themes';

import { DOME_COLOR, DOME_HIGHLIGHT_COLOR, SIZE, TICK_MS } from './constants';
import { ufoIdleFrame } from './helpers';
import type { UfoButtonProps } from './types';

/**
 * Bouton d'acces aux reglages, en forme de soucoupe volante qui flotte doucement sur place
 * (feux du pourtour qui clignotent). Remplace un simple bouton roue crantee.
 */
export const UfoButton = ({ onPress, accessibilityLabel }: UfoButtonProps) => {
  const { colors } = useTheme();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const { bobY, blinkOpacityA, blinkOpacityB } = ufoIdleFrame(elapsedMs);
  const rimRx = SIZE / 2;
  const rimRy = SIZE / 7;

  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" hitSlop={12} onPress={onPress}>
      <Svg height={SIZE + rimRy * 3} width={SIZE}>
        <G transform={`translate(${SIZE / 2} ${SIZE / 2 + bobY})`}>
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
        </G>
      </Svg>
    </Pressable>
  );
};

