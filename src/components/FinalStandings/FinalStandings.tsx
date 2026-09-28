import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Screen from '@/components/ui/Screen';
import type { FinalStandingsProps } from './types';

import { createStyles } from './styles';

/**
 * End-of-game ranking shared by the games that score every player on one total (Clues, Silhouette,
 * local or online) — dumb: title, the winner (or the tie) as a banner once there's more than one
 * player, the ranked list, and the button that leaves the game.
 */
export const FinalStandings = ({ title, entries, homeLabel, onHome }: FinalStandingsProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  const standings = [...entries].sort((a, b) => b.total - a.total);
  const highest = standings[0]?.total ?? 0;
  const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>
      {standings.length > 1 && (
        <Text style={styles.banner}>
          {winners.length > 1 ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `)) : t.endScreen.winner(winners[0])}
        </Text>
      )}
      <Card>
        {standings.map((entry, index) => (
          <View key={entry.name + index} style={[styles.row, index > 0 && styles.rowBorder]}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <Text style={styles.name}>{entry.name}</Text>
            <Text style={styles.score}>
              {formatNumber(entry.total)} {t.common.pts}
            </Text>
          </View>
        ))}
      </Card>
      <Button label={homeLabel} onPress={onHome} />
    </Screen>
  );
};
