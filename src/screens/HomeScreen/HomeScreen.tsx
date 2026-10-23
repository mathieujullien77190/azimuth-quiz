import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HOME_COMPASS_SIZE, SPLASH_MIN_MS } from '@/data';
import { APP_CODENAME, APP_VERSION_NUMBER } from '@/helpers/appInfo';
import { useStartup } from '@/store/startupStore';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import AppTitle from '../../components/home/AppTitle';
import LoadingBar from '../../components/home/LoadingBar';
import MascotButton from '../../components/home/MascotButton';
import SwayingCompass from '../../components/home/SwayingCompass';
import Button from '../../components/ui/Button';
import Screen from '../../components/ui/Screen';

import { createStyles } from './styles';

/**
 * Accueil, qui est aussi l'ecran de demarrage : titre, boussole dont l'aiguille oscille, puis au pied la barre de
 * chargement qui laisse la place aux boutons « Jouer » / « Rejoindre » une fois l'app prete. Le bouton reglages
 * (la mascotte) est toujours en haut.
 */
export const HomeScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const loading = useStartup((state) => state.loading);
  // La barre n'existe que si l'accueil s'ouvre pendant le chargement (elle se retire seule apres sa liberation).
  const [showsBar] = useState(loading);

  return (
    <Screen>
      <AppTitle tagline={t.app.tagline}>
        {/* La mascotte (OVNI la nuit, helicoptere le jour — voir MascotButton) est le bouton reglages, fixe en haut a droite. */}
        <View style={styles.mascotButton}>
          <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
        </View>
      </AppTitle>

      <View style={styles.body}>
        <SwayingCompass size={HOME_COMPASS_SIZE} />

        <View style={styles.footer}>
          {!loading && (
            <>
              <Button label={t.home.play} onPress={() => router.push('/setup')} />
              <Button
                label={t.home.join}
                onPress={() => router.push({ pathname: '/setup', params: { join: '1' } })}
                variant="ghost"
              />
            </>
          )}
          {showsBar && (
            <LoadingBar
              codename={APP_CODENAME}
              fillMs={SPLASH_MIN_MS}
              loading={loading}
              loadingLabel={t.splash.loading}
              version={APP_VERSION_NUMBER}
            />
          )}
        </View>
      </View>
    </Screen>
  );
};
