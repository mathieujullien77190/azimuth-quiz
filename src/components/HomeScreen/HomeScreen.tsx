import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { GAME_ICONS } from '@/data';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import GameCard from '../GameCard';
import MascotButton from '../MascotButton';
import Screen from '../ui/Screen';
import { APP_TITLE } from './constants';

import { createStyles } from './styles';

export const HomeScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Screen>
      <View style={styles.header}>
        {/* The mascot (UFO by night, helicopter by day — see MascotButton) is the settings button, fixed at the top right. */}
        <View style={styles.mascotButton}>
          <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
        </View>
        <Text style={styles.title}>{APP_TITLE}</Text>
        <Text style={styles.tagline}>{t.home.tagline}</Text>
      </View>

      <View style={styles.games}>
        <GameCard
          ctaLabel={t.home.games.compass.cta}
          icon={GAME_ICONS.compass}
          maxPlayers={10}
          onPress={() => router.push('/setup')}
          tagline={t.home.games.compass.tagline}
          title={t.home.games.compass.title}
        />
        <GameCard
          ctaLabel={t.home.games.clues.cta}
          icon={GAME_ICONS.clues}
          maxPlayers={10}
          onPress={() => router.push('/clues-setup')}
          tagline={t.home.games.clues.tagline}
          title={t.home.games.clues.title}
        />
        <GameCard
          ctaLabel={t.home.games.contour.cta}
          icon={GAME_ICONS.contour}
          maxPlayers={10}
          onPress={() => router.push('/contour-setup')}
          tagline={t.home.games.contour.tagline}
          title={t.home.games.contour.title}
        />
      </View>
    </Screen>
  );
};
