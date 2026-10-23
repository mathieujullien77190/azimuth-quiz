import { reporting } from '@/helpers/reportError';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { smoothHeading } from './helpers';
import type { UseHeadingResult, WebOrientationEvent } from './types';

/**
 /**
  * Cap tire d'un evenement d'orientation : `webkitCompassHeading` (Safari iOS) sinon `alpha` (Chrome/Android),
  * converti en sens horaire. `null` si rien d'exploitable.
  */
const readWebHeading = (event: WebOrientationEvent): number | null => {
  if (typeof event.webkitCompassHeading === 'number') return event.webkitCompassHeading;
  if (event.absolute === true && event.alpha !== null) return (360 - event.alpha) % 360;
  return null;
};

/**
 * Cap du telephone en degres (0 = haut de l'ecran vers le nord), ou null si la boussole live est
 * desactivee/indisponible. Vrai nord, repli sur le nord magnetique sans position.
 * Web : `expo-location` ne gere pas le cap, on ecoute `deviceorientation(absolute)`. Safari iOS exige un
 * `requestPermission()` declenche par un geste, d'ou `onTouch` (1er toucher de la boussole).
 */
export const useHeading = (enabled: boolean): UseHeadingResult => {
  const [heading, setHeading] = useState<number | null>(null);
  const webListener = useRef<{ eventName: string; handler: (event: Event) => void } | null>(null);

  const detachWeb = useCallback(() => {
    if (webListener.current === null) return;
    window.removeEventListener(webListener.current.eventName, webListener.current.handler);
    webListener.current = null;
  }, []);

  const onTouch = useCallback(() => {
    if (!enabled || Platform.OS !== 'web' || webListener.current !== null) return;

    const handler = (event: Event) => {
      const next = readWebHeading(event as WebOrientationEvent);
      if (next !== null) setHeading((previous) => smoothHeading(previous, next));
    };
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    const attach = () => {
      window.addEventListener(eventName, handler);
      webListener.current = { eventName, handler };
    };

    const requestPermission = (
      window as typeof window & { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }
    ).DeviceOrientationEvent?.requestPermission;
    if (typeof requestPermission === 'function') {
      requestPermission()
        .then((result) => {
          if (result === 'granted') attach();
        })
        .catch(reporting('compass.headingPermission', { kind: 'background' }));
    } else {
      attach();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setHeading(null);
      detachWeb();
      return undefined;
    }
    if (Platform.OS === 'web') return detachWeb;

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
        // Capteur indisponible : la boussole reste orientee vers le haut.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, detachWeb]);

  return { heading: enabled ? heading : null, onTouch };
};
