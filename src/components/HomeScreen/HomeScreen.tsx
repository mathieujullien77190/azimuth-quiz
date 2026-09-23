import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatNumber, loadBestScore, loadUfoCaught, saveUfoCaught } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import GameCard from '../GameCard';
import UfoButton from '../UfoButton';
import Screen from '../ui/Screen';
import { APP_TITLE, UFO_MOVE_DURATION_MS, UFO_SPIN_DURATION_MS, UFO_SPIN_PAUSE_S } from './constants';
import { randomUfoPauseSeconds, randomUfoPosition } from './helpers';

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
      zIndex: 10,
      elevation: 10,
    },
    ufoButtonDefault: {
      top: spacing.sm,
      right: spacing.lg,
    },
    ufoButtonRoaming: {
      top: 0,
      left: 0,
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

  // Tant qu'elle n'a jamais ete cliquee, la soucoupe vole vers une position aleatoire dans la zone
  // du titre (transition animee), attend 3 a 6 sec sur place, tourne sur elle-meme une fois si
  // cette pause tombe sur 6 sec, puis repart. Une fois attrapee (cliquee, memorise pour toujours),
  // elle reste fixe a sa position par defaut (haut droite, `ufoButtonDefault`).
  const [ufoCaught, setUfoCaught] = useState(true);
  const [ufoZone, setUfoZone] = useState({ width: 0, height: 0 });
  const ufoAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const ufoRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUfoCaught().then(setUfoCaught);
  }, []);

  const roaming = !ufoCaught && ufoZone.width > 0 && ufoZone.height > 0;

  useEffect(() => {
    if (!roaming) return undefined;
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const start = randomUfoPosition(ufoZone.width, ufoZone.height);
    ufoAnim.setValue({ x: start.left, y: start.top });

    const scheduleNextMove = () => {
      if (!active) return;
      const target = randomUfoPosition(ufoZone.width, ufoZone.height);
      Animated.timing(ufoAnim, {
        duration: UFO_MOVE_DURATION_MS,
        toValue: { x: target.left, y: target.top },
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        const pauseS = randomUfoPauseSeconds();
        if (pauseS === UFO_SPIN_PAUSE_S) {
          ufoRotation.setValue(0);
          Animated.timing(ufoRotation, {
            duration: UFO_SPIN_DURATION_MS,
            toValue: 1,
            useNativeDriver: true,
          }).start(({ finished: spun }) => {
            if (spun) ufoRotation.setValue(0);
          });
        }
        timeoutId = setTimeout(scheduleNextMove, pauseS * 1000);
      });
    };

    scheduleNextMove();

    return () => {
      active = false;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      ufoAnim.stopAnimation();
      ufoRotation.stopAnimation();
    };
  }, [roaming, ufoZone, ufoAnim, ufoRotation]);

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    setUfoZone({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
  };

  const onUfoPress = () => {
    if (!ufoCaught) {
      setUfoCaught(true);
      saveUfoCaught();
    }
    router.push('/settings');
  };

  const ufoSpin = ufoRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const bestScoreNote = bestScore > 0 ? `${t.common.record(formatNumber(bestScore))} ${t.common.pts}` : undefined;

  return (
    <Screen>
      <View onLayout={onHeaderLayout} style={styles.header}>
        {roaming ? (
          <Animated.View
            style={[
              styles.ufoButton,
              styles.ufoButtonRoaming,
              { transform: [...ufoAnim.getTranslateTransform(), { rotate: ufoSpin }] },
            ]}
          >
            <UfoButton accessibilityLabel={t.home.settingsButtonLabel} onPress={onUfoPress} />
          </Animated.View>
        ) : (
          <View style={[styles.ufoButton, styles.ufoButtonDefault]}>
            <UfoButton accessibilityLabel={t.home.settingsButtonLabel} onPress={onUfoPress} />
          </View>
        )}
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
