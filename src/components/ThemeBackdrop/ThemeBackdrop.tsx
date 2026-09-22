import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { useTheme } from '@/themes';

import { GRID_OPACITY, GRID_SPACING, STAR_COUNT, STAR_SEED } from './constants';
import { buildGridLines, buildStars } from './helpers';

/**
 * Decor de fond derriere l'ecran : un ciel etoile en mode Nuit, un quadrillage en mode Papier.
 * Purement decoratif (pointerEvents none), pose derriere le contenu.
 */
export const ThemeBackdrop = () => {
  const { isDark, colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => buildStars(STAR_COUNT, STAR_SEED), []);
  const grid = useMemo(() => buildGridLines(width, height, GRID_SPACING), [width, height]);

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
                opacity={star.opacity}
                r={star.radius}
              />
            ))
          : [
              ...grid.vertical.map((x, index) => (
                <Line
                  key={`v${index}`}
                  opacity={GRID_OPACITY}
                  stroke={colors.border}
                  strokeWidth={1}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={height}
                />
              )),
              ...grid.horizontal.map((y, index) => (
                <Line
                  key={`h${index}`}
                  opacity={GRID_OPACITY}
                  stroke={colors.border}
                  strokeWidth={1}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                />
              )),
            ]}
      </Svg>
    </View>
  );
};
