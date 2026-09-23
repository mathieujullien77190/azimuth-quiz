import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { MAX_PROGRESS_DOTS } from './constants';
import { formatRoundProgress } from './helpers';
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
 * Ligne "MANCHE N / M" + pastilles de progression : partagee telle quelle entre Boussole
 * (`GameScreen`) et Indices (`IndicesGameScreen`), seul le nombre de manches differe. Les
 * pastilles disparaissent au-dela de `MAX_PROGRESS_DOTS` (illisibles trop nombreuses) ; la
 * pastille d'index `roundNumber - 1` (la manche en cours) compte deja comme "faite".
 */
const RoundProgress = ({ roundNumber, totalRounds }: RoundProgressProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {t.game.round} {formatRoundProgress(roundNumber, totalRounds)}
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
