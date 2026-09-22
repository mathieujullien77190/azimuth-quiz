import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatNumber, loadBestScore } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import GameCard from '../GameCard';
import UfoButton from '../UfoButton';
import Screen from '../ui/Screen';
import { APP_TITLE } from './constants';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    ufoButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.lg,
      zIndex: 10,
      elevation: 10,
    },
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.display,
      letterSpacing: 6,
      textAlign: 'center',
    },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    games: {
      gap: spacing.md,
    },
  });

export const HomeScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [bestScore, setBestScore] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadBestScore().then(setBestScore);
    }, []),
  );

  const bestScoreNote = bestScore > 0 ? `${t.common.record(formatNumber(bestScore))} ${t.common.pts}` : undefined;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.ufoButton}>
          <UfoButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
        </View>
        <Text style={styles.title}>{APP_TITLE}</Text>
        <Text style={styles.tagline}>{t.home.tagline}</Text>
      </View>

      <View style={styles.games}>
        <GameCard
          ctaLabel={t.home.games.compass.cta}
          icon="🧭"
          meta={t.home.games.compass.meta}
          note={bestScoreNote}
          onPress={() => router.push('/setup')}
          tagline={t.home.games.compass.tagline}
          title={t.home.games.compass.title}
        />
        <GameCard
          ctaLabel={t.home.games.clues.cta}
          icon="🧩"
          meta={t.home.games.clues.meta}
          onPress={() => router.push('/indices-setup')}
          tagline={t.home.games.clues.tagline}
          title={t.home.games.clues.title}
        />
      </View>
    </Screen>
  );
};
