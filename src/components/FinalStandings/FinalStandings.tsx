import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import { MEDALS } from './constants';
import { rankEntries } from './helpers';
import type { FinalStandingsProps } from './types';

import { createStyles } from './styles';

/**
 * End-of-game scoreboard shared by every game — dumb: title, the winner (or the tie) as a banner once
 * there's more than one player, the ranked scores (medals for the podium), then whatever the game adds
 * as `children` (Compass' rank card and round-by-round recap, the button that leaves the game...).
 */
export const FinalStandings = ({ title, entries, children }: FinalStandingsProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  const ranked = rankEntries(entries);
  const winners = ranked.filter((entry) => entry.rank === 1).map((entry) => entry.name);

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>

      {ranked.length > 1 && (
        <Text style={styles.banner}>
          {winners.length > 1 ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `)) : t.endScreen.winner(winners[0])}
        </Text>
      )}

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

      {children}
    </Screen>
  );
};
