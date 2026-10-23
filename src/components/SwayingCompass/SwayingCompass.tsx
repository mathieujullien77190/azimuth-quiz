import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/themes';

import { DIAL_CENTER, NEEDLE_FROM_DEG, NEEDLE_TO_DEG, SWAY_MS } from './constants';
import type { SwayingCompassProps } from './types';

import { createStyles } from './styles';

/**
 * Cadran de boussole dont l'aiguille oscille sans fin entre deux caps (decor de l'accueil).
 */
export const SwayingCompass = ({ size }: SwayingCompassProps) => {
  const { colors, compass, isDark, typography } = useTheme();
  const styles = useMemo(() => createStyles(size), [size]);
  const [sway] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const leg = (toValue: number) =>
      Animated.timing(sway, { toValue, duration: SWAY_MS, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    const swing = Animated.loop(Animated.sequence([leg(1), leg(0)]));
    swing.start();
    return () => swing.stop();
  }, [sway]);

  const north = isDark ? colors.accent : colors.danger;
  const southTip = isDark ? colors.accent : colors.accentDark;
  const letter = {
    fill: colors.textMuted,
    fontFamily: typography.heading.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    textAnchor: 'middle',
  } as const;

  return (
    <View style={styles.dial}>
      <Svg height={size} width={size} viewBox="0 0 300 300">
        <Circle cx={DIAL_CENTER} cy={DIAL_CENTER} fill={compass.faceInner} r={140} stroke={colors.border} strokeWidth={3} />
        <Circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          fill="none"
          r={104}
          stroke={colors.border}
          strokeDasharray="2 6"
          strokeWidth={1.5}
        />
        <G stroke={colors.textMuted} strokeWidth={2}>
          <Line x1={150} x2={150} y1={14} y2={34} />
          <Line x1={150} x2={150} y1={266} y2={286} />
          <Line x1={14} x2={34} y1={150} y2={150} />
          <Line x1={266} x2={286} y1={150} y2={150} />
        </G>
        <SvgText {...letter} fill={north} x={150} y={66}>
          N
        </SvgText>
        <SvgText {...letter} x={150} y={246}>
          S
        </SvgText>
        <SvgText {...letter} x={52} y={157}>
          O
        </SvgText>
        <SvgText {...letter} x={248} y={157}>
          E
        </SvgText>
      </Svg>
      <Animated.View
        style={[
          styles.needle,
          {
            transform: [
              {
                rotate: sway.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${NEEDLE_FROM_DEG}deg`, `${NEEDLE_TO_DEG}deg`],
                }),
              },
            ],
          },
        ]}
      >
        <Svg height={size} width={size} viewBox="0 0 300 300">
          <Polygon fill={colors.danger} points="150,34 164,150 136,150" />
          <Polygon fill={southTip} points="150,266 164,150 136,150" />
          <Circle cx={DIAL_CENTER} cy={DIAL_CENTER} fill={colors.background} r={9} stroke={colors.text} strokeWidth={3} />
        </Svg>
      </Animated.View>
    </View>
  );
};
