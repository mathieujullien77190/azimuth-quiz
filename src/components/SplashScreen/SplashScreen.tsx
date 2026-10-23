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
 * Ecran de demarrage : titre partage `AppTitle` (a la meme position qu'a l'accueil), cadran de boussole a
 * aiguille oscillante, barre de chargement realiste (`buildProgressSteps`, finissant sur le temps minimum
 * `fillMs`, completee a la liberation) avec son pourcentage, libelle qui respire et ligne de version. Suit le
 * theme du joueur. Tant que `visible`, il joue ; une fois faux, il s'efface et se retire seul.
 */
export const SplashScreen = ({ visible, tagline, loadingLabel, version, codename, fillMs, random }: SplashScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, compass, isDark, typography } = useTheme();
  // State plutot que refs : les valeurs sont lues au rendu (interpolations ci-dessous).
  const [sway] = useState(() => new Animated.Value(0));
  // Progression de la barre en pourcent (0-100) ; le calendrier des a-coups est tire une fois par lancement.
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
    // La largeur de la barre ne peut pas utiliser le driver natif : seule animation sur le thread JS. Chaque
    // keyframe attend son heure (blocage) puis saute ou rampe vers sa valeur.
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

  // Le pourcentage ne change que par points entiers, pour ne pas redessiner le cadran a chaque image de la barre.
  useEffect(() => {
    const id = fill.addListener(({ value }) => setPercent(Math.round(value)));
    return () => fill.removeListener(id);
  }, [fill]);

  useEffect(() => {
    if (visible) return;
    // Liberation : la barre se complete pendant le fondu (elle n'atteignait pas 100 % avant : l'app n'etait pas prete).
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
