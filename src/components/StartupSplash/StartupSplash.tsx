import { StyleSheet, View } from 'react-native';

import SplashScreen from '@/components/SplashScreen';
import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { useSplashGate } from '@/helpers/useSplashGate';
import { useLanguage, useTranslation } from '@/i18n';
import { usePlayerName, useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';

import { BOOT_BACKGROUND, SPLASH_CODENAME, SPLASH_VERSION_NUMBER } from './constants';

/**
 * Splash de demarrage sur toute l'app (monte une fois dans le layout racine, dans les providers). Il sait quand
 * l'app est prete (theme, langue, reglages, nom lus), garde le splash au moins `SPLASH_MIN_MS` et le
 * retire a `SPLASH_MAX_MS` quoi qu'il arrive. Tant que le theme n'est pas connu, il ne peint que la couleur de demarrage.
 */
export const StartupSplash = () => {
  const t = useTranslation();
  const { ready: themeReady } = useThemeSettings();
  const { ready: languageReady } = useLanguage();
  const settingsReady = useSettings((state) => state.ready);
  const nameReady = usePlayerName((state) => state.ready);
  const visible = useSplashGate(
    themeReady && languageReady && settingsReady && nameReady,
    SPLASH_MIN_MS,
    SPLASH_MAX_MS,
  );
  if (!themeReady) {
    return visible ? <View style={[StyleSheet.absoluteFill, { backgroundColor: BOOT_BACKGROUND, zIndex: 1000 }]} testID="boot-splash" /> : null;
  }

  return (
    <SplashScreen
      fillMs={SPLASH_MIN_MS}
      tagline={t.app.tagline}
      loadingLabel={t.splash.loading}
      version={SPLASH_VERSION_NUMBER}
      codename={SPLASH_CODENAME}
      visible={visible}
    />
  );
};
