import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { USE_NATIVE_DRIVER } from '@/helpers';

import { useThemedStyles } from '@/themes';

import VersionLine from '@/components/ui/VersionLine';

import { BLINK_MIN_OPACITY, BLINK_MS } from './constants';
import { buildProgressSteps } from './helpers';
import type { LoadingBarProps } from './types';

import { createStyles } from './styles';

/**
 * Barre de chargement du pied de l'accueil : barre realiste (`buildProgressSteps`, finissant sur le temps minimum
 * `fillMs`, sous 100 %) avec son pourcentage, libelle qui respire et ligne de version. L'accueil la remplace par ses
 * boutons des que l'app est prete (un simple `if`, sans fondu).
 */
export const LoadingBar = ({ loadingLabel, version, codename, fillMs, random }: LoadingBarProps) => {
  const styles = useThemedStyles(createStyles);
  // Progression de la barre en pourcent (0-100) ; le calendrier des a-coups est tire une fois par lancement.
  const [fill] = useState(() => new Animated.Value(0));
  const [steps] = useState(() => buildProgressSteps(fillMs, random));
  const [percent, setPercent] = useState(0);
  const [blink] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: BLINK_MS, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(blink, { toValue: 0, duration: BLINK_MS, useNativeDriver: USE_NATIVE_DRIVER }),
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
          Animated.timing(fill, {
            toValue: to,
            duration: easeMs,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
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

  return (
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
  );
};
