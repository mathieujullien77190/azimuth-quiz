import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { useTheme } from '@/themes';

import {
  CLOUD_COUNT,
  CLOUD_HEIGHT,
  CLOUD_PUFFS,
  CLOUD_SEED,
  CLOUD_WIDTH,
  STAR_COUNT,
  STAR_SEED,
  TWINKLE_TICK_MS,
} from './constants';
import { buildClouds, buildStars, cloudXRatio, twinkleOpacity } from './helpers';

/** Background décor behind the screen: a twinkling starry sky at night, drifting clouds in a
 * blue sky by day (see `theme.isDark`). Purely decorative (pointerEvents none). */
export const ThemeBackdrop = () => {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(STAR_COUNT, STAR_SEED), []);
  const clouds = useMemo(() => buildClouds(CLOUD_COUNT, CLOUD_SEED), []);
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
        {isDark
          ? stars.map((star, index) => (
              <Circle
                key={index}
                cx={star.xRatio * width}
                cy={star.yRatio * height}
                fill={colors.text}
                opacity={twinkleOpacity(star, elapsedMs)}
                r={star.radius}
              />
            ))
          : clouds.map((cloud, index) => {
              const cloudWidth = CLOUD_WIDTH * cloud.scale;
              const x = cloudXRatio(cloud, elapsedMs) * (width + cloudWidth) - cloudWidth;
              const y = cloud.yRatio * height;
              return (
                <G key={index} opacity={cloud.opacity} transform={`translate(${x}, ${y}) scale(${cloud.scale})`}>
                  {CLOUD_PUFFS.map((puff, puffIndex) => (
                    <Ellipse
                      key={puffIndex}
                      cx={puff.cx * CLOUD_WIDTH}
                      cy={puff.cy * CLOUD_HEIGHT}
                      fill={colors.surface}
                      rx={puff.rx * CLOUD_WIDTH}
                      ry={puff.ry * CLOUD_HEIGHT}
                    />
                  ))}
                </G>
              );
            })}
      </Svg>
    </View>
  );
};
