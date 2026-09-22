import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatNumber, loadBestScore } from '@/helpers';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Compass from '../Compass';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import { APP_TAGLINE, APP_TITLE, DECORATIVE_BEARING, PLAY_LABEL, RULES } from './constants';
import { compassSizeFor } from './helpers';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    header: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingTop: spacing.md,
    },
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.display,
      letterSpacing: 6,
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
  const [bestScore, setBestScore] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadBestScore().then(setBestScore);
    }, []),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{APP_TITLE}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
      </View>

      <View style={styles.compass}>
        <Compass size={compassSizeFor(width)} bearing={DECORATIVE_BEARING} />
      </View>

      <Card style={styles.rules}>
        {RULES.map(({ emoji, text }) => (
          <View key={text} style={styles.rule}>
            <Text style={styles.ruleEmoji}>{emoji}</Text>
            <Text style={styles.ruleText}>{text}</Text>
          </View>
        ))}
      </Card>

      {bestScore > 0 && <Text style={styles.best}>Record : {formatNumber(bestScore)} pts</Text>}

      <View style={styles.spacer} />
      <Button label={PLAY_LABEL} onPress={() => router.push('/setup')} />
    </Screen>
  );
};
