import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import PlayerTabs from '@/components/PlayerTabs';
import RoundProgress from '@/components/RoundProgress';
import QuitButton from '@/components/ui/QuitButton';
import type { GameHeaderProps } from './types';

import { createStyles } from './styles';

/**
 * The in-round header shared by every game — dumb. Top row: the quit cross and the room code on the
 * left, this device's name and points on the right. Then "Manche 3 / 10 · difficulty" aligned left, the
 * players' tabs when `players` is given, and the round's `question` centered at the bottom.
 */
export const GameHeader = ({
  onQuit,
  code,
  name,
  points,
  roundNumber,
  totalRounds,
  difficulty,
  players,
  turnIndex = -1,
  question,
}: GameHeaderProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.left}>
          <QuitButton onPress={onQuit} />
          <Text style={styles.code}>{code.toUpperCase()}</Text>
        </View>
        <Text style={styles.score}>
          {name} · {formatNumber(points)} {t.common.pts}
        </Text>
      </View>
      <RoundProgress difficulty={difficulty} roundNumber={roundNumber} totalRounds={totalRounds} />
      {players !== undefined && (
        <PlayerTabs
          activeIndex={turnIndex}
          activeLabel={t.game.playerTurn}
          answered={players.map(() => false)}
          order={players.map((_, index) => index)}
          players={players}
        />
      )}
      {question !== undefined && <Text style={styles.question}>{question}</Text>}
    </View>
  );
};
