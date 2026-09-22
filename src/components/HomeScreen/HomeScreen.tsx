import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatNumber, loadBestScore } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '../Compass';
import UfoButton from '../UfoButton';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import { APP_TITLE, DECORATIVE_BEARING } from './constants';
import { compassSizeFor } from './helpers';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
    },
    ufoButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.lg,
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
    compass: {
      alignItems: 'center',
      marginVertical: spacing.sm,
    },
    rules: {
      gap: spacing.sm + 2,
    },
    rule: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    ruleEmoji: {
      fontSize: 22,
    },
    ruleText: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      fontWeight: '600',
      flex: 1,
    },
    best: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    spacer: {
      flexGrow: 1,
    },
  });

export const HomeScreen = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [bestScore, setBestScore] = useState(0);
  const [bearing, setBearing] = useState(DECORATIVE_BEARING);

  useFocusEffect(
    useCallback(() => {
      loadBestScore().then(setBestScore);
    }, []),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.ufoButton}>
          <UfoButton accessibilityLabel={t.home.settingsButtonLabel} onPress={() => router.push('/settings')} />
        </View>
        <Text style={styles.title}>{APP_TITLE}</Text>
        <Text style={styles.tagline}>{t.home.tagline}</Text>
      </View>

      <View style={styles.compass}>
        <Compass size={compassSizeFor(width)} bearing={bearing} onChange={setBearing} />
      </View>

      <Card style={styles.rules}>
        {t.home.rules.map(({ emoji, text }) => (
          <View key={text} style={styles.rule}>
            <Text style={styles.ruleEmoji}>{emoji}</Text>
            <Text style={styles.ruleText}>{text}</Text>
          </View>
        ))}
      </Card>

      {bestScore > 0 && (
        <Text style={styles.best}>
          {t.common.record(formatNumber(bestScore))} {t.common.pts}
        </Text>
      )}

      <View style={styles.spacer} />
      <Button label={t.home.play} onPress={() => router.push('/setup')} />
    </Screen>
  );
};
