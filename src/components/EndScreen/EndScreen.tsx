import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { formatNumber, getRank } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Confetti from '../Confetti';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import { MEDALS } from './constants';
import { maxTotalScore, rankPlayers, roundWinnerIndex, winnerTitle } from './helpers';
import type { EndScreenProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    hero: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    rankEmoji: {
      fontSize: 56,
    },
    rankTitle: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      textAlign: 'center',
    },
    score: {
      ...typography.display,
      color: colors.text,
      fontSize: 64,
      marginTop: spacing.sm,
    },
    best: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      marginTop: spacing.md,
    },
    newBest: {
      backgroundColor: colors.accent,
      borderRadius: radius.button,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      marginTop: spacing.md,
    },
    newBestText: {
      ...typography.heading,
      color: colors.onAccent,
      fontSize: fontSize.body,
    },
    list: {
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    medal: {
      fontSize: 28,
      width: 36,
      textAlign: 'center',
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    rowText: {
      flex: 1,
    },
    name: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    detail: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    rowScore: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
  });

export const EndScreen = ({ players, records, totals, bestScore, isNewBest, onReplay, onMenu }: EndScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const isSolo = players.length === 1;
  const maxTotal = maxTotalScore(records);
  const ranking = rankPlayers(players, totals);
  const rank = getRank(totals[0] ?? 0, maxTotal, t.endScreen.ranks);

  return (
    <Screen header={<Confetti />}>
      <Card style={styles.hero}>
        {isSolo ? (
          <>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <Text style={styles.rankTitle}>{rank.title}</Text>
            <Text style={styles.score}>{formatNumber(totals[0] ?? 0)}</Text>
            {isNewBest ? (
              <View style={styles.newBest}>
                <Text style={styles.newBestText}>{t.endScreen.newBest}</Text>
              </View>
            ) : (
              <Text style={styles.best}>{t.common.record(formatNumber(bestScore))}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.rankEmoji}>🏆</Text>
            <Text style={styles.rankTitle}>{winnerTitle(ranking, t.endScreen)}</Text>
          </>
        )}
      </Card>

      {!isSolo && (
        <Card style={styles.list}>
          {ranking.map(({ player, total, rank: position }, index) => (
            <View key={player.name + index} style={[styles.row, index > 0 && styles.rowBorder]}>
              <Text style={styles.medal}>{MEDALS[position - 1] ?? `${position}.`}</Text>
              <View style={[styles.dot, { backgroundColor: player.color }]} />
              <Text style={[styles.name, styles.rowText]}>{player.name}</Text>
              <Text style={styles.rowScore}>{formatNumber(total)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card style={styles.list}>
        {records.map((record, index) => {
          const winner = roundWinnerIndex(record);
          const best = record.results[winner];
          return (
            <View key={`${record.place.name}-${index}`} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{record.place.name}</Text>
                <Text style={styles.detail}>{isSolo ? record.place.country : t.endScreen.roundBest(players[winner].name)}</Text>
              </View>
              <Text style={styles.rowScore}>+{best.score.total}</Text>
            </View>
          );
        })}
      </Card>

      <Button label={t.endScreen.replay} onPress={onReplay} />
      <Button label={t.endScreen.menu} onPress={onMenu} variant="ghost" />
    </Screen>
  );
};
