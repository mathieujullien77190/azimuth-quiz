import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import PlayerTabs from '@/components/PlayerTabs';
import DifficultyBadge from '@/components/DifficultyBadge';
import RoundCounter from '@/components/RoundCounter';
import QuitButton from '@/components/ui/QuitButton';
import type { GameHeaderProps } from './types';

import { createStyles } from './styles';

/**
 * The in-round header shared by every game — dumb. Top row: the quit cross and the room code on the
 * left, this device's name and points on the right. Then "Manche 3 / 10 · difficulty" (`RoundCounter`, `DifficultyBadge`) aligned left, the
 * players' tabs when `players` is given, and the round's `question` centered at the bottom — or, with a `questionDetail`, the question on the left and the detail on the right of one row.
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
  location,
  question,
  questionDetail,
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
      <View style={styles.progress}>
        <RoundCounter roundNumber={roundNumber} totalRounds={totalRounds} />
        <Text style={styles.separator}>·</Text>
        <DifficultyBadge difficulty={difficulty} />
      </View>
      {location !== undefined && <Text style={styles.location}>{location}</Text>}
      {players !== undefined && (
        <PlayerTabs
          activeIndex={turnIndex}
          activeLabel={t.game.playerTurn}
          order={players.map((_, index) => index)}
          players={players}
        />
      )}
      {question !== undefined &&
        (questionDetail === undefined ? (
          <Text style={styles.question}>{question}</Text>
        ) : (
          // With a detail (Silhouette's points at stake) the question moves to the left and the detail to the right.
          <View style={styles.questionRow}>
            <Text style={styles.questionLeft}>{question}</Text>
            <Text style={styles.questionDetail}>{questionDetail}</Text>
          </View>
        ))}
    </View>
  );
};
