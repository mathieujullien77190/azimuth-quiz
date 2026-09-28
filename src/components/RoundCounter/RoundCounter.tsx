import { memo } from 'react';
import { Text } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import { formatRoundCount } from './helpers';
import type { RoundCounterProps } from './types';

import { createStyles } from './styles';

/** "MANCHE 3 / 10": where the game is, in every game's header. */
export const RoundCounter = memo(function RoundCounter({ roundNumber, totalRounds }: RoundCounterProps) {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Text style={styles.label}>
      {t.game.round} {formatRoundCount(roundNumber, totalRounds)}
    </Text>
  );
});
