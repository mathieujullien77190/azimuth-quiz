import { memo } from 'react';
import { Text } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import { formatDifficulty } from './helpers';
import type { DifficultyBadgeProps } from './types';

import { createStyles } from './styles';

/** "🟡 MOYEN": the round's difficulty, as its emoji and label, in every game's header. */
export const DifficultyBadge = memo(function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();
  // DIFFICULTIES lists every Difficulty value, so the lookup always finds a match.
  const emoji = difficultyEmoji(
    DIFFICULTIES.find((entry) => entry.id === difficulty)!,
    isDark,
  );

  return <Text style={styles.label}>{formatDifficulty(emoji, t.setup.difficulties[difficulty])}</Text>;
});
