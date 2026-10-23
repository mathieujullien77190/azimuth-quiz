import { View } from 'react-native';

import { HOME_COMPASS_SIZE, SPLASH_MIN_MS } from '@/data';
import { APP_CODENAME, APP_VERSION_NUMBER } from '@/helpers/appInfo';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import AppTitle from '@/components/home/AppTitle';
import LoadingBar from '@/components/home/LoadingBar';
import MascotButton from '@/components/home/MascotButton';
import SwayingCompass from '@/components/home/SwayingCompass';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';

import { createStyles } from './HomeScreenView.styles';
import type { HomeScreenViewProps } from './types';

/** Pur rendu de l'accueil : titre, boussole, puis au pied la barre de chargement ou les boutons. */
export const HomeScreenView = ({ loading, onSettings, onPlay, onJoin }: HomeScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen>
      <AppTitle tagline={t.app.tagline}>
        {/* La mascotte (OVNI la nuit, helicoptere le jour — voir MascotButton) est le bouton reglages, fixe en haut a droite. */}
        <View style={styles.mascotButton}>
          <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={onSettings} />
        </View>
      </AppTitle>

      <View style={styles.body}>
        <SwayingCompass size={HOME_COMPASS_SIZE} />

        <View style={styles.footer}>
          {loading ? (
            <LoadingBar
              codename={APP_CODENAME}
              fillMs={SPLASH_MIN_MS}
              loadingLabel={t.splash.loading}
              version={APP_VERSION_NUMBER}
            />
          ) : (
            <>
              <Button label={t.home.play} onPress={onPlay} />
              <Button label={t.home.join} onPress={onJoin} variant="ghost" />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
};
