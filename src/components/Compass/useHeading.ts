import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { smoothHeading } from './helpers';

/**
 * Cap du telephone en degres (0 = le haut de l'ecran pointe vers le nord), ou null si la
 * boussole reelle est desactivee / indisponible (web, refus de permission, pas de capteur).
 * Utilise le vrai nord ; a defaut de position, le nord magnetique.
 */
export const useHeading = (enabled: boolean): number | null => {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      setHeading(null);
      return undefined;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted || cancelled) return;

        subscription = await Location.watchHeadingAsync((reading) => {
          const raw = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
          setHeading((previous) => smoothHeading(previous, raw));
        });
        if (cancelled) subscription.remove();
      } catch {
        // Capteur indisponible : la boussole reste orientee vers le haut, comme avant.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return enabled ? heading : null;
};
