import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/themes';

import { DIAL_CENTER, SETTLE_MS, SWAY_TOTAL_MS } from './constants';
import { angleAt, SWAY_CURVE } from './helpers';
import type { SwayingCompassProps } from './types';

import { createStyles } from './styles';

/**
 * Cadran de boussole dont l'aiguille oscille de moins en moins autour du nord (balancier amorti, courbe continue),
 * puis s'immobilise au bout d'une minute (decor de l'accueil). Un appui lui redonne de l'elan : l'oscillation repart
 * sans saut, l'ecart au moment de l'appui s'effacant en douceur.
 */
export const SwayingCompass = ({ size }: SwayingCompassProps) => {
  const { colors, compass, isDark, typography } = useTheme();
  const t = useTranslation();
  const styles = useMemo(() => createStyles(size), [size]);
  // `progress` (0..1) suit la courbe amortie ; `offset` (degres) est l'ecart a rattraper apres un appui.
  const [progress] = useState(() => new Animated.Value(0));
  const [offset] = useState(() => new Animated.Value(0));
  const angle = useMemo(() => Animated.add(progress.interpolate(SWAY_CURVE), offset), [progress, offset]);

  const play = useCallback(
    (from: number) => {
      progress.setValue(0);
      offset.setValue(from);
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: SWAY_TOTAL_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: SETTLE_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [progress, offset],
  );

  useEffect(() => {
    play(0);
    return () => {
      progress.stopAnimation();
      offset.stopAnimation();
    };
  }, [play, progress, offset]);

  const push = () =>
    progress.stopAnimation((current) => offset.stopAnimation((remaining) => play(angleAt(current) + remaining)));

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
    <Pressable
      accessibilityLabel={t.compassAccessibilityLabel}
      accessibilityRole="button"
      onPress={push}
      style={styles.dial}
    >
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
                rotate: angle.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] }),
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
    </Pressable>
  );
};
