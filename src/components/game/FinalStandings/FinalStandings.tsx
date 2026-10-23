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
 * Classement de fin de partie commun aux jeux (dumb) : titre, vainqueur (ou egalite) en banniere des qu'il y a
 * plusieurs joueurs, scores classes (medailles au podium), `children` propres au jeu, puis rejouer / quitter.
 */
export const FinalStandings = ({ title, entries, localName, maxScore, children, onReplay, onQuit }: FinalStandingsProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  const ranked = rankEntries(entries);
  const winners = ranked.filter((entry) => entry.rank === 1).map((entry) => entry.name);
  const iWon = winners.length === 1 && winners[0] === localName;

  return (
    <Screen>
      <Text style={styles.title}>{title}</Text>

      {ranked.length > 1 && (
        <Text style={styles.banner}>
          {winners.length > 1
            ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `))
            : iWon
              ? t.endScreen.youWin
              : t.endScreen.winner(winners[0])}
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

      {maxScore !== undefined && <Text style={styles.maxScore}>{t.endScreen.maxScore(formatNumber(maxScore))}</Text>}

      {children}

      <Button label={t.endScreen.replay} onPress={onReplay} />
      <Button label={t.endScreen.quit} onPress={onQuit} variant="ghost" />
    </Screen>
  );
};
