import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { loadMascotCaught, saveMascotCaught } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles, useThemeSettings } from '@/themes';
import type { Theme } from '@/types';

import GameCard from '../GameCard';
import MascotButton from '../MascotButton';
import Screen from '../ui/Screen';
import { APP_TITLE, MASCOT_MOVE_DURATION_MS, MASCOT_SPIN_DURATION_MS, MASCOT_SPIN_PAUSE_S } from './constants';
import { randomMascotPauseSeconds, randomMascotPosition } from './helpers';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    mascotButton: {
      position: 'absolute',
      zIndex: 10,
      elevation: 10,
    },
    mascotButtonDefault: {
      top: spacing.sm,
      right: spacing.lg,
    },
    mascotButtonRoaming: {
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
  const { animationsEnabled } = useThemeSettings();

  // As long as it's never been clicked, the mascot (UFO by night, helicopter by day — see
  // MascotButton) flies to a random position within the title zone (animated transition),
  // waits 3 to 6 sec in place, spins in place once if that pause lands on 6 sec, then moves on.
  // Once caught (clicked, remembered forever), it stays fixed at its default position (top
  // right, `mascotButtonDefault`).
  const [mascotCaught, setMascotCaught] = useState(true);
  const [mascotZone, setMascotZone] = useState({ width: 0, height: 0 });
  const mascotAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const mascotRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMascotCaught().then(setMascotCaught);
  }, []);

  const roaming = animationsEnabled && !mascotCaught && mascotZone.width > 0 && mascotZone.height > 0;

  useEffect(() => {
    if (!roaming) return undefined;
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const start = randomMascotPosition(mascotZone.width, mascotZone.height);
    mascotAnim.setValue({ x: start.left, y: start.top });

    // No `active` guard needed here: the only two call sites are the initial synchronous call
    // below and the recursive one inside the move's callback (scheduled via `timeoutId`), and
    // cleanup always clears `timeoutId` in the same tick it sets `active = false` — so this can
    // never run again after unmount.
    const scheduleNextMove = () => {
      const target = randomMascotPosition(mascotZone.width, mascotZone.height);
      Animated.timing(mascotAnim, {
        duration: MASCOT_MOVE_DURATION_MS,
        toValue: { x: target.left, y: target.top },
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!active || !finished) return;
        const pauseS = randomMascotPauseSeconds();
        if (pauseS === MASCOT_SPIN_PAUSE_S) {
          mascotRotation.setValue(0);
          Animated.timing(mascotRotation, {
            duration: MASCOT_SPIN_DURATION_MS,
            toValue: 1,
            useNativeDriver: true,
          }).start(({ finished: spun }) => {
            if (spun) mascotRotation.setValue(0);
          });
        }
        timeoutId = setTimeout(scheduleNextMove, pauseS * 1000);
      });
    };

    scheduleNextMove();

    return () => {
      active = false;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      mascotAnim.stopAnimation();
      mascotRotation.stopAnimation();
    };
  }, [roaming, mascotZone, mascotAnim, mascotRotation]);

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    setMascotZone({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
  };

  const onMascotPress = () => {
    if (!mascotCaught) {
      setMascotCaught(true);
      saveMascotCaught();
    }
    router.push('/settings');
  };

  const mascotSpin = mascotRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen>
      <View onLayout={onHeaderLayout} style={styles.header}>
        {roaming ? (
          <Animated.View
            style={[
              styles.mascotButton,
              styles.mascotButtonRoaming,
              { transform: [...mascotAnim.getTranslateTransform(), { rotate: mascotSpin }] },
            ]}
          >
            <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={onMascotPress} />
          </Animated.View>
        ) : (
          <View style={[styles.mascotButton, styles.mascotButtonDefault]}>
            <MascotButton accessibilityLabel={t.home.settingsButtonLabel} onPress={onMascotPress} />
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
