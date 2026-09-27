import { Text, View } from 'react-native';
import { countryName } from '@/data/places/countries';
import { formatNumber, getRank } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import { MEDALS } from './constants';
import { maxTotalScore, rankPlayers, roundWinnerIndex, winnerTitle } from './helpers';
import type { EndScreenProps } from './types';

import { createStyles } from './styles';

export const EndScreen = ({ players, records, totals, onReplay, onMenu }: EndScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const { language } = useLanguage();
  const isSolo = players.length === 1;
  const maxTotal = maxTotalScore(records);
  const ranking = rankPlayers(players, totals);
  const rank = getRank(totals[0] ?? 0, maxTotal, t.endScreen.ranks);

  return (
    <Screen>
      <Card style={styles.hero}>
        {isSolo ? (
          <>
            <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            <Text style={styles.rankTitle}>{rank.title}</Text>
            <Text style={styles.score}>{formatNumber(totals[0] ?? 0)}</Text>
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
              <Text style={styles.medal}>{MEDALS[position - 1] ?? ''}</Text>
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
          // Online only: a round played before a player quit can have more `results` than the
          // room has players left — that round's winner may no longer be one of them, even
          // though `players[winner]` types as always-defined (no `noUncheckedIndexedAccess`).
          const winnerPlayer: (typeof players)[number] | undefined = players[winner];
          return (
            <View key={`${record.place.name}-${index}`} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{record.place.name}</Text>
                <Text style={styles.detail}>
                  {isSolo
                    ? countryName(record.place.code, language)
                    : winnerPlayer && t.endScreen.roundBest(winnerPlayer.name)}
                </Text>
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
