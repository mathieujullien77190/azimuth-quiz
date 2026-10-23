import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { GAME_ICONS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import AppTitle from '../AppTitle';
import GameCard from '../GameCard';
import MascotButton from '../MascotButton';
import Screen from '../ui/Screen';

import { createStyles } from './styles';

export const HomeScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen>
      <AppTitle tagline={t.app.tagline}>
        {/* La mascotte (OVNI la nuit, helicoptere le jour — voir MascotButton) est le bouton reglages, fixe en haut a droite. */}
        <View style={styles.mascotButton}>
          <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
        </View>
      </AppTitle>

      <View style={styles.games}>
        <GameCard
          ctaLabel={t.home.games.compass.cta}
          icon={GAME_ICONS.compass}
          maxPlayers={10}
          onPress={() => router.push('/setup')}
          tagline={t.home.games.compass.tagline}
          title={t.home.games.compass.title}
        />
      </View>
    </Screen>
  );
};
