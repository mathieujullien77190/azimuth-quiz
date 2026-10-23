import { NavigationBar } from 'expo-navigation-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** `value` une fois stable depuis `delayMs` (la premiere valeur est rendue de suite), pour ne pas ecrire a chaque frappe. */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};

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

/**
 * Masque la barre de navigation Android pendant une partie (elle recouvre les boutons du footer) ; un swipe depuis
 * le bas la rend un instant. Android seul, cosmetique : un echec est ignore.
 */
export const useImmersiveNavigationBar = (): void => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const setHidden = (hidden: boolean) => {
      try {
        NavigationBar.setHidden(hidden);
      } catch {
        // La barre reste telle quelle.
      }
    };
    setHidden(true);
    return () => setHidden(false);
  }, []);
};
