import { memo } from 'react';
import { Text, View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Difficulty } from '@/types';

import { MAX_PROGRESS_DOTS } from './constants';
import { formatDifficulties, formatRoundProgress } from './helpers';
import type { RoundProgressProps } from './types';

import { createStyles } from './styles';

/**
 * "ROUND N / M" line + progress dots: shared as-is between Compass (`GameScreen`) and Clues
 * (`ClueGameScreen`) — only the round count and the active difficulty/ies differ. The dots
 * disappear past `MAX_PROGRESS_DOTS` (unreadable once there are too many); the dot at index
 * `roundNumber - 1` (the current round) already counts as "done".
 */
const RoundProgress = memo(function RoundProgress({ roundNumber, totalRounds, difficulties }: RoundProgressProps) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();
  // DIFFICULTIES lists every Difficulty value, so the lookup always finds a match.
  const emojiOf = (id: Difficulty) =>
    difficultyEmoji(
      DIFFICULTIES.find((d) => d.id === id)!,
      isDark,
    );

  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {t.game.round} {formatRoundProgress(roundNumber, totalRounds)} ·{' '}
        {formatDifficulties(difficulties, emojiOf, (id: Difficulty) => t.setup.difficulties[id])}
      </Text>
      {totalRounds <= MAX_PROGRESS_DOTS && (
        <View style={styles.dots}>
          {Array.from({ length: totalRounds }, (_, index) => (
            <View key={index} style={[styles.dot, index < roundNumber && styles.dotDone]} />
          ))}
        </View>
      )}
    </View>
  );
});

export default RoundProgress;
