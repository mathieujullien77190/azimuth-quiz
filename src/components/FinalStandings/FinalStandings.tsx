import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import { MEDALS } from './constants';
import { rankEntries } from './helpers';
import type { FinalStandingsProps } from './types';

import { createStyles } from './styles';

/**
 * End-of-game screen shared by every game — dumb: title, the winner (or the tie) as a banner once
 * there's more than one player, the ranked scores (medals for the podium), then — for the games that
 * score several things per round — a round-by-round recap of who was best at each, and the button that
 * leaves the game. A `hero` (Compass' solo rank) stands in for the banner, and for the list when
 * alone.
 */
export const FinalStandings = ({ title, entries, homeLabel, onHome, hero, recap }: FinalStandingsProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  const ranked = rankEntries(entries);
  const winners = ranked.filter((entry) => entry.rank === 1).map((entry) => entry.name);
  const alone = ranked.length === 1;

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>

      {hero !== undefined && (
        <Card style={styles.hero}>
          <Text style={styles.heroEmoji}>{hero.emoji}</Text>
          <Text style={styles.heroTitle}>{hero.title}</Text>
          {alone && <Text style={styles.heroScore}>{formatNumber(ranked[0].total)}</Text>}
        </Card>
      )}

      {hero === undefined && !alone && (
        <Text style={styles.banner}>
          {winners.length > 1 ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `)) : t.endScreen.winner(winners[0])}
        </Text>
      )}

      {(hero === undefined || !alone) && (
        <Card>
          {ranked.map((entry, index) => (
            <View key={entry.name + index} style={[styles.row, index > 0 && styles.rowBorder]}>
              <Text style={styles.rank}>{MEDALS[entry.rank - 1] ?? `${entry.rank}.`}</Text>
              {entry.color !== undefined && <View style={[styles.dot, { backgroundColor: entry.color }]} />}
              <Text style={styles.name}>{entry.name}</Text>
              <Text style={styles.score}>
                {formatNumber(entry.total)} {t.common.pts}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {recap !== undefined && (
        <Card>
          <Text style={styles.recapTitle}>{recap.title}</Text>
          <View style={styles.row}>
            <View style={styles.recapLabel} />
            {recap.columns.map((column) => (
              <Text key={column} style={[styles.recapCell, styles.recapHeader]}>
                {column}
              </Text>
            ))}
          </View>
          {recap.rows.map((row, index) => (
            <View key={row.label + index} style={[styles.row, styles.rowBorder]}>
              <Text numberOfLines={2} style={[styles.name, styles.recapLabel]}>
                {row.label}
              </Text>
              {row.cells.map((cell, cellIndex) => (
                <View key={cellIndex} style={styles.recapCell}>
                  <View style={styles.cellLine}>
                    {cell.color !== undefined && <View style={[styles.dot, { backgroundColor: cell.color }]} />}
                    <Text style={styles.cellText}>{cell.text}</Text>
                  </View>
                  {cell.detail !== undefined && <Text style={styles.cellDetail}>{cell.detail}</Text>}
                </View>
              ))}
            </View>
          ))}
        </Card>
      )}

      <Button label={homeLabel} onPress={onHome} />
    </Screen>
  );
};
