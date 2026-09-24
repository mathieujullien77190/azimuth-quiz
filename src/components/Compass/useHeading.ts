import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { smoothHeading } from './helpers';
import type { UseHeadingResult, WebOrientationEvent } from './types';

/**
 * Heading derived from a browser orientation event: `webkitCompassHeading` (Safari iOS, already
 * true north) otherwise `alpha` from an absolute event (Chrome/Android), converted from
 * trigonometric to clockwise direction. `null` if the event has nothing usable.
 */
const readWebHeading = (event: WebOrientationEvent): number | null => {
  if (typeof event.webkitCompassHeading === 'number') return event.webkitCompassHeading;
  if (event.absolute === true && event.alpha !== null) return (360 - event.alpha) % 360;
  return null;
};

/**
 * Phone heading in degrees (0 = top of the screen points to north), or null if the
 * live compass is disabled / unavailable (permission denied, no sensor).
 * Uses true north; falls back to magnetic north without a position.
 *
 * On web, `expo-location` doesn't support heading (see `ExpoLocation.web.ts`): we listen
 * directly to the browser's `deviceorientation(absolute)` API. Safari iOS only allows this
 * listener after a `requestPermission()` triggered by a real user gesture — impossible
 * to request it on its own on mount. `onTouch` (called on the compass's first touch) serves
 * this request; without that (Android, or a browser without this restriction), listening starts right away.
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
        .catch(() => {});
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
        // Sensor unavailable: the compass stays oriented upward, as before.
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, detachWeb]);

  return { heading: enabled ? heading : null, onTouch };
};
