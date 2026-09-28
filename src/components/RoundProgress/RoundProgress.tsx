import { memo } from 'react';
import { Text, View } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Difficulty } from '@/types';

import { formatDifficulty, formatRoundProgress } from './helpers';
import type { RoundProgressProps } from './types';

import { createStyles } from './styles';

/**
 * "MANCHE 3 / 10 · 🟡 Moyen", one line, aligned left: the round, then the round's difficulty.
 * Shared by every game's header.
 */
const RoundProgress = memo(function RoundProgress({ roundNumber, totalRounds, difficulty }: RoundProgressProps) {
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
        {formatDifficulty(difficulty, emojiOf, (id) => t.setup.difficulties[id])}
      </Text>
    </View>
  );
});

export default RoundProgress;
