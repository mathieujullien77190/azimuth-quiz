import { useEffect, useState } from 'react';

/**
 * Whether the startup splash screen is still to be shown: until the app is `ready` AND `minMs` have gone by since this
 * mounted — so a fast start still shows the splash for its minimum time — or until `maxMs`, whatever the app is doing:
 * a hydration that never ends must not hide the app for ever (it is as it was before the splash existed).
 */
export const useSplashGate = (ready: boolean, minMs: number, maxMs: number): boolean => {
  const [minPassed, setMinPassed] = useState(false);
  const [capped, setCapped] = useState(false);

  useEffect(() => {
    const min = setTimeout(() => setMinPassed(true), minMs);
    const max = setTimeout(() => setCapped(true), maxMs);
    return () => {
      clearTimeout(min);
      clearTimeout(max);
    };
  }, [minMs, maxMs]);

  return !((ready && minPassed) || capped);
};
