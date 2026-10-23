import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { USE_NATIVE_DRIVER } from '@/helpers';

import { useTheme } from '@/themes';

import { DIAL_CENTER, MAX_ANGLE_DEG } from './constants';
import { PEAK_CURVE, planCycle, REST_CURVE } from './helpers';
import type { SwayingCompassProps } from './types';

import { createStyles } from './styles';

/**
 * Cadran de boussole (decor de l'accueil) dont l'aiguille se balance de moins en moins autour du nord, puis, apres un
 * nombre de sens tire au hasard et sur un sommet ou elle est a l'arret et deja lente, fait plusieurs tours rapides
 * avant de repartir en balancier, sans jamais sauter. Le cycle se repete.
 */
export const SwayingCompass = ({ size, random = Math.random }: SwayingCompassProps) => {
  const { colors, compass, isDark, typography } = useTheme();
  const styles = useMemo(() => createStyles(size), [size]);
  // `progress` (0..1) avance sur la courbe du balancier, `turn` ajoute les degres des tours rapides ; `cycle` compte les
  // cycles deja joues (le premier part du nord, les suivants du sommet haut atteint a la fin des tours).
  const [progress] = useState(() => new Animated.Value(0));
  const [turn] = useState(() => new Animated.Value(0));
  const [cycle, setCycle] = useState(0);
  const angle = useMemo(
    () => Animated.add(progress.interpolate(cycle === 0 ? REST_CURVE : PEAK_CURVE), turn),
    [progress, turn, cycle],
  );

  useEffect(() => {
    const plan = planCycle(cycle === 0, random);
    progress.setValue(0);
    turn.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: plan.swayTo,
        duration: plan.swayMs,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(turn, {
        toValue: plan.turnDeg,
        duration: plan.spinMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setCycle((count) => count + 1);
    });
    return () => animation.stop();
  }, [progress, turn, cycle, random]);

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
        <Circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          fill={compass.faceInner}
          r={140}
          stroke={colors.border}
          strokeWidth={3}
        />
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
                rotate: angle.interpolate({
                  inputRange: [-MAX_ANGLE_DEG, MAX_ANGLE_DEG],
                  outputRange: [`-${MAX_ANGLE_DEG}deg`, `${MAX_ANGLE_DEG}deg`],
                }),
              },
            ],
          },
        ]}
      >
        <Svg height={size} width={size} viewBox="0 0 300 300">
          <Polygon fill={colors.danger} points="150,34 164,150 136,150" />
          <Polygon fill={southTip} points="150,266 164,150 136,150" />
          <Circle
            cx={DIAL_CENTER}
            cy={DIAL_CENTER}
            fill={colors.background}
            r={9}
            stroke={colors.text}
            strokeWidth={3}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
