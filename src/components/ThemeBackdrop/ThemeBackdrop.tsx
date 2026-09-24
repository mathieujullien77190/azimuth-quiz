import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/themes';

import { STAR_COUNT, STAR_SEED, TWINKLE_TICK_MS } from './constants';
import { buildStars, twinkleOpacity } from './helpers';

/** Background décor behind the screen: a twinkling starry sky. Purely decorative (pointerEvents none). */
export const ThemeBackdrop = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(STAR_COUNT, STAR_SEED), []);
  // Time elapsed since mount: 0 on first render (static export included, no hydration
  // mismatch), then incremented via a client-side-only timer.
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - start), TWINKLE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height={height} width={width}>
        {stars.map((star, index) => (
          <Circle
            key={index}
            cx={star.xRatio * width}
            cy={star.yRatio * height}
            fill={colors.text}
            opacity={twinkleOpacity(star, elapsedMs)}
            r={star.radius}
          />
        ))}
      </Svg>
    </View>
  );
};
