import { useEffect, useState } from 'react';

/**
 * Le splash est-il encore a montrer ? Jusqu'a `ready` ET `minMs` ecoulees, ou `maxMs` quoi qu'il arrive (une
 * hydratation sans fin ne doit pas cacher l'app).
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
