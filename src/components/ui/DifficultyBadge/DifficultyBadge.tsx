import { memo } from 'react';
import { Text } from 'react-native';

import { DIFFICULTIES, difficultyEmoji } from '@/data';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import { formatDifficulty } from './helpers';
import type { DifficultyBadgeProps } from './types';

import { createStyles } from './styles';

/** "🟡 MOYEN" : difficulte de la manche, dans l'en-tete de chaque jeu. */
export const DifficultyBadge = memo(function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();
  // DIFFICULTIES liste toutes les valeurs, donc la recherche trouve toujours.
  const emoji = difficultyEmoji(
    DIFFICULTIES.find((entry) => entry.id === difficulty)!,
    isDark,
  );

  return <Text style={styles.label}>{formatDifficulty(emoji, t.setup.difficulties[difficulty])}</Text>;
});
