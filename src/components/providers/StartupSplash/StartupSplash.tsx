import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { useStartup } from '@/helpers/startupStore';
import { useSplashGate } from '@/helpers/useSplashGate';
import { useLanguage } from '@/i18n';
import { usePlayerName, useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';

import { BOOT_BACKGROUND } from './constants';

/**
 * Chargement de depart de toute l'app (monte une fois dans le layout racine, dans les providers). Il sait quand
 * l'app est prete (theme, langue, reglages, nom lus), garde le chargement au moins `SPLASH_MIN_MS` et le termine
 * a `SPLASH_MAX_MS` quoi qu'il arrive : l'etat part dans `useStartup`, que l'accueil montre en barre puis en
 * boutons. Tant que le theme n'est pas connu, il ne peint que la couleur de demarrage (pas de flash du mauvais theme).
 */
export const StartupSplash = () => {
  const { ready: themeReady } = useThemeSettings();
  const { ready: languageReady } = useLanguage();
  const settingsReady = useSettings((state) => state.ready);
  const nameReady = usePlayerName((state) => state.ready);
  const loading = useSplashGate(
    themeReady && languageReady && settingsReady && nameReady,
    SPLASH_MIN_MS,
    SPLASH_MAX_MS,
  );

  useEffect(() => {
    useStartup.setState({ loading });
  }, [loading]);

  if (themeReady || !loading) return null;
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: BOOT_BACKGROUND, zIndex: 1000 }]} testID="boot-splash" />;
};
