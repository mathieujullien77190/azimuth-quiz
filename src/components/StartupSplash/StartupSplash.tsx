import { StyleSheet, View } from 'react-native';

import SplashScreen from '@/components/SplashScreen';
import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { useSplashGate } from '@/helpers/useSplashGate';
import { useLanguage, useTranslation } from '@/i18n';
import { useDevCode, usePlayerName, useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';

import { versionLabel } from '@/helpers/version';
import { BOOT_BACKGROUND, SPLASH_CODENAME, SPLASH_VERSION_NUMBER } from './constants';

/**
 * The startup splash, over the whole app (mounted once in the root layout, inside the providers): smart — it knows
 * when the app is ready (the saved theme, language, settings, name and dev code have all been read), keeps the splash up
 * for at least `SPLASH_MIN_MS` even if nothing was left to load, and drops it at `SPLASH_MAX_MS` whatever happens.
 * Until the saved theme is known it only paints the boot colour, since the splash cannot tell night from day yet.
 */
export const StartupSplash = () => {
  const t = useTranslation();
  const { ready: themeReady } = useThemeSettings();
  const { ready: languageReady } = useLanguage();
  const settingsReady = useSettings((state) => state.ready);
  const nameReady = usePlayerName((state) => state.ready);
  const devCodeReady = useDevCode((state) => state.ready);
  const visible = useSplashGate(
    themeReady && languageReady && settingsReady && nameReady && devCodeReady,
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
      versionLabel={versionLabel(SPLASH_VERSION_NUMBER, SPLASH_CODENAME)}
      visible={visible}
    />
  );
};
