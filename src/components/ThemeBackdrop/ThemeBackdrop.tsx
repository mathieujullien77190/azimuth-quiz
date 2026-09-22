import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/themes';

import { STAR_COUNT, STAR_SEED } from './constants';
import { buildStars } from './helpers';

/** Decor de fond derriere l'ecran : un ciel etoile. Purement decoratif (pointerEvents none). */
export const ThemeBackdrop = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(STAR_COUNT, STAR_SEED), []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height={height} width={width}>
        {stars.map((star, index) => (
          <Circle
            key={index}
            cx={star.xRatio * width}
            cy={star.yRatio * height}
            fill={colors.text}
            opacity={star.opacity}
            r={star.radius}
          />
        ))}
      </Svg>
    </View>
  );
};
