import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { useSplashGate } from '@/helpers/hooks';
import { useLanguage } from '@/i18n';
import { usePlayerName, useSettings } from '@/settings';
import { useThemeSettings } from '@/themes';

import { BOOT_STYLE } from './constants';
import { HomeScreenView } from './HomeScreenView';

/**
 * Accueil, qui est aussi l'ecran de demarrage : titre, boussole dont l'aiguille oscille, puis au pied la barre de
 * chargement ou, une fois l'app prete, les boutons « Jouer » / « Rejoindre ». L'accueil reste monte toute la session
 * (pile de navigation) : l'etat du chargement est local, il attend theme, langue, reglages et nom, au moins
 * `SPLASH_MIN_MS` et au plus `SPLASH_MAX_MS`. Tant que le theme n'est pas connu, il ne peint que la couleur de
 * demarrage (pas de flash du mauvais theme).
 */
export const HomeScreen = () => {
  const router = useRouter();
  const { ready: themeReady } = useThemeSettings();
  const { ready: languageReady } = useLanguage();
  const settingsReady = useSettings((state) => state.ready);
  const nameReady = usePlayerName((state) => state.ready);
  const loading = useSplashGate(
    themeReady && languageReady && settingsReady && nameReady,
    SPLASH_MIN_MS,
    SPLASH_MAX_MS,
  );

  if (!themeReady && loading) return <View style={BOOT_STYLE} testID="boot-splash" />;

  return (
    <HomeScreenView
      loading={loading}
      onJoin={() => router.push({ pathname: '/setup', params: { join: '1' } })}
      onPlay={() => router.push('/setup')}
      onSettings={() => router.push('/settings')}
    />
  );
};
