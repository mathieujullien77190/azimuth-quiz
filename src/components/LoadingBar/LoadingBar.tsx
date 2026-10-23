import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import VersionLine from '../VersionLine';

import { BLINK_MIN_OPACITY, BLINK_MS, FADE_OUT_MS } from './constants';
import { buildProgressSteps } from './helpers';
import type { LoadingBarProps } from './types';

import { createStyles } from './styles';

/**
 * Barre de chargement du pied de l'accueil : barre realiste (`buildProgressSteps`, finissant sur le temps minimum
 * `fillMs`, completee a la liberation) avec son pourcentage, libelle qui respire et ligne de version. Tant que
 * `loading`, elle joue ; une fois faux, elle se complete, s'efface et se retire seule (l'accueil montre alors
 * ses boutons a la meme place).
 */
export const LoadingBar = ({ loading, loadingLabel, version, codename, fillMs, random }: LoadingBarProps) => {
  const styles = useThemedStyles(createStyles);
  // Progression de la barre en pourcent (0-100) ; le calendrier des a-coups est tire une fois par lancement.
  const [fill] = useState(() => new Animated.Value(0));
  const [steps] = useState(() => buildProgressSteps(fillMs, random));
  const [percent, setPercent] = useState(0);
  const [blink] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
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
    breathe.start();
    filling.start();
    return () => {
      breathe.stop();
      filling.stop();
    };
  }, [blink, fill, steps]);

  // Le pourcentage ne change que par points entiers, pour ne pas redessiner a chaque image de la barre.
  useEffect(() => {
    const id = fill.addListener(({ value }) => setPercent(Math.round(value)));
    return () => fill.removeListener(id);
  }, [fill]);

  useEffect(() => {
    if (loading) return;
    // Liberation : la barre se complete pendant le fondu (elle n'atteignait pas 100 % avant : l'app n'etait pas prete).
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 100, duration: FADE_OUT_MS, useNativeDriver: false }).start();
    Animated.timing(fade, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true }).start(() => setMounted(false));
  }, [loading, fade, fill]);

  if (!mounted) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.footer, { opacity: fade }]}>
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
    </Animated.View>
  );
};
