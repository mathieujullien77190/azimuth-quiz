import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/themes';

import { STAR_COUNT, STAR_SEED, TWINKLE_MIN_OPACITY_RATIO } from './constants';
import { buildStars } from './helpers';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Decor de fond derriere l'ecran : un ciel etoile qui scintille. Purement decoratif (pointerEvents none). */
export const ThemeBackdrop = () => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(STAR_COUNT, STAR_SEED), []);
  // Un driver 0..1 par etoile : interpole vers son opacite (creux -> plein -> creux...).
  const [twinkles] = useState(() => stars.map(() => new Animated.Value(0)));

  useEffect(() => {
    const loops = stars.map((star, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkles[index], {
            toValue: 1,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: false,
          }),
          Animated.timing(twinkles[index], {
            toValue: 0,
            duration: star.duration,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [stars, twinkles]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height={height} width={width}>
        {stars.map((star, index) => (
          <AnimatedCircle
            key={index}
            cx={star.xRatio * width}
            cy={star.yRatio * height}
            fill={colors.text}
            opacity={twinkles[index].interpolate({
              inputRange: [0, 1],
              outputRange: [star.opacity * TWINKLE_MIN_OPACITY_RATIO, star.opacity],
            })}
            r={star.radius}
          />
        ))}
      </Svg>
    </View>
  );
};
