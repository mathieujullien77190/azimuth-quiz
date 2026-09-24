import { StyleSheet, Text, View } from 'react-native';

import { DIFFICULTIES, fontSize, spacing } from '@/constants';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Difficulty, Theme } from '@/types';

import { MAX_PROGRESS_DOTS } from './constants';
import { formatDifficulties, formatRoundProgress } from './helpers';
import type { RoundProgressProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    dots: {
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotDone: {
      backgroundColor: colors.accent,
    },
  });

/**
 * "ROUND N / M" line + progress dots: shared as-is between Boussole (`GameScreen`) and Indices
 * (`IndicesGameScreen`) — only the round count and the active difficulty/ies differ. The dots
 * disappear past `MAX_PROGRESS_DOTS` (unreadable once there are too many); the dot at index
 * `roundNumber - 1` (the current round) already counts as "done".
 */
const RoundProgress = ({ roundNumber, totalRounds, difficulties }: RoundProgressProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  // DIFFICULTIES lists every Difficulty value, so the lookup always finds a match.
  const emojiOf = (id: Difficulty) => DIFFICULTIES.find((d) => d.id === id)!.emoji;

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
};

export default RoundProgress;
