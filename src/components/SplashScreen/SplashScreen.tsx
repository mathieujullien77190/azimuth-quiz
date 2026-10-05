import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { useTheme, useThemedStyles } from '@/themes';

import AppTitle from '../AppTitle';
import VersionLine from '../VersionLine';

import {
  BLINK_MIN_OPACITY,
  BLINK_MS,
  DIAL_CENTER,
  DIAL_SIZE,
  FADE_OUT_MS,
  NEEDLE_FROM_DEG,
  NEEDLE_TO_DEG,
  SWAY_MS,
} from './constants';
import { buildProgressSteps } from './helpers';
import type { SplashScreenProps } from './types';

import { createStyles } from './styles';

/**
 * The startup splash screen — dumb: the title block (the shared `AppTitle`, drawn at the very position it has on the home screen), a compass dial whose needle swings (red north tip, the
 * accent colour south), a loading bar that jumps and stalls like a real loader
 * (`buildProgressSteps`, ending on the `fillMs` minimum time and completed when the splash is released) with its
 * percentage, a breathing "loading" label and the version line. It follows the
 * theme of the player (night or day) through the theme tokens. While `visible` it just plays; once it turns false it
 * fades out and removes itself, so whoever mounts it only has to say when it is wanted.
 */
export const SplashScreen = ({ visible, tagline, loadingLabel, version, codename, fillMs, random }: SplashScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, compass, isDark, typography } = useTheme();
  // State rather than refs: the values are read while rendering (the interpolations below).
  const [sway] = useState(() => new Animated.Value(0));
  // The bar's progress, in percent (0-100); the schedule of its jumps and stalls is drawn once per launch.
  const [fill] = useState(() => new Animated.Value(0));
  const [steps] = useState(() => buildProgressSteps(fillMs, random));
  const [percent, setPercent] = useState(0);
  const [blink] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const swing = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: SWAY_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: SWAY_MS,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: BLINK_MS, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 0, duration: BLINK_MS, useNativeDriver: true }),
      ]),
    );
    // The bar's width cannot be animated by the native driver: it is the only one that runs on the JS thread. Each
    // keyframe waits for its time (a stall), then jumps or creeps to its value.
    let previousEnd = 0;
    const filling = Animated.sequence(
      steps.flatMap(({ at, to, easeMs }) => {
        const wait = at - previousEnd;
        previousEnd = at + easeMs;
        return [
          Animated.delay(wait),
          Animated.timing(fill, { toValue: to, duration: easeMs, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        ];
      }),
    );
    swing.start();
    breathe.start();
    filling.start();
    return () => {
      swing.stop();
      breathe.stop();
      filling.stop();
    };
  }, [sway, blink, fill, steps]);

  // The percentage under the bar changes whole points only, so the dial is not redrawn on every frame of the bar.
  useEffect(() => {
    const id = fill.addListener(({ value }) => setPercent(Math.round(value)));
    return () => fill.removeListener(id);
  }, [fill]);

  useEffect(() => {
    if (visible) return;
    // Released: the bar completes while the splash fades out (it never reached 100 % before: the app was not ready).
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 100, duration: FADE_OUT_MS, useNativeDriver: false }).start();
    Animated.timing(fade, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start(() => setMounted(false));
  }, [visible, fade, fill]);

  if (!mounted) return null;

  const fontFamily = typography.heading.fontFamily;
  const north = isDark ? colors.accent : colors.danger;
  const southTip = isDark ? colors.accent : colors.accentDark;
  const letter = { fill: colors.textMuted, fontFamily, fontSize: 20, fontWeight: '700', textAnchor: 'middle' } as const;

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[styles.screen, { opacity: fade }]}>
      <SafeAreaView style={styles.layout}>
        <AppTitle tagline={tagline} />

        <View style={styles.body}>
          <View style={styles.dial}>
            <Svg height={DIAL_SIZE} width={DIAL_SIZE} viewBox="0 0 300 300">
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
                      rotate: sway.interpolate({
                        inputRange: [0, 1],
                        outputRange: [`${NEEDLE_FROM_DEG}deg`, `${NEEDLE_TO_DEG}deg`],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Svg height={DIAL_SIZE} width={DIAL_SIZE} viewBox="0 0 300 300">
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

          <View style={styles.footer}>
            <View style={styles.track}>
              <Animated.View
                style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
              />
            </View>
            <View style={styles.loadingRow}>
              <Animated.Text
                style={[
                  styles.loading,
                  { opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [BLINK_MIN_OPACITY, 1] }) },
                ]}
              >
                {loadingLabel}
              </Animated.Text>
              <Text style={styles.loading}>{`${percent}%`}</Text>
            </View>
            <VersionLine codename={codename} style={styles.version} version={version} />
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};
