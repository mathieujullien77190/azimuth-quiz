import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, formatBearing, formatDistance, formatInclination } from '@/helpers';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Card from '../ui/Card';
import { LAST_LABEL, NEXT_LABEL, ROW_LABELS, ROW_MAX_POINTS, TRUTH_LABEL } from './constants';
import { feedbackColor } from './helpers';
import type { RoundResultProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    truth: {
      gap: 2,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
    },
    truthLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      marginBottom: 2,
    },
    truthRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    truthRowLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      width: 90,
    },
    truthValue: {
      ...typography.heading,
      color: colors.truth,
      fontSize: fontSize.subtitle,
    },
    player: {
      gap: spacing.xs,
    },
    playerBorder: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    playerHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    playerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    playerName: {
      ...typography.heading,
      flex: 1,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    playerTotal: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    rowLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      width: 90,
    },
    rowValue: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      fontSize: fontSize.body - 1,
    },
    rowPoints: {
      ...typography.heading,
      fontSize: fontSize.body,
    },
  });

export const RoundResult = ({ record, players, options, isLastRound, onNext }: RoundResultProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { score: truth } = record.results[0];
  const isSolo = players.length === 1;

  // Les joueurs sont classes par points sur la manche (le meilleur en premier).
  const ranked = record.results
    .map((result, index) => ({ result, player: players[index] }))
    .sort((a, b) => b.result.score.total - a.result.score.total);

  return (
    <Card style={styles.card}>
      <View style={styles.truth}>
        <Text style={styles.truthLabel}>{TRUTH_LABEL}</Text>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{ROW_LABELS.direction}</Text>
          <Text style={styles.truthValue}>{formatBearing(truth.trueBearing)}</Text>
        </View>
        {options.straightLine && (
          <View style={styles.truthRow}>
            <Text style={styles.truthRowLabel}>{ROW_LABELS.inclination}</Text>
            <Text style={styles.truthValue}>{formatInclination(truth.trueInclination)}</Text>
          </View>
        )}
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{ROW_LABELS.distance}</Text>
          <Text style={styles.truthValue}>{formatDistance(truth.trueSurfaceDistanceKm)}</Text>
        </View>
      </View>

      {ranked.map(({ result, player }, position) => (
        <View key={player.name + position} style={[styles.player, position > 0 && styles.playerBorder]}>
          <View style={styles.playerHead}>
            {!isSolo && <View style={[styles.playerDot, { backgroundColor: player.color }]} />}
            <Text style={styles.playerName}>{isSolo ? 'Ton score' : player.name}</Text>
            <Text style={styles.playerTotal}>+{result.score.total}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{ROW_LABELS.direction}</Text>
            <Text style={styles.rowValue}>
              {formatBearing(result.guess.bearing)} (écart {Math.round(result.score.directionError)}°)
            </Text>
            <Text
              style={[
                styles.rowPoints,
                { color: feedbackColor(colors, result.score.directionPoints, ROW_MAX_POINTS.direction) },
              ]}
            >
              +{result.score.directionPoints}
            </Text>
          </View>
          {options.straightLine && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{ROW_LABELS.inclination}</Text>
              <Text style={styles.rowValue}>{formatInclination(result.guess.inclination)}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{ROW_LABELS.distance}</Text>
            <Text style={styles.rowValue}>
              {formatDistance(options.straightLine ? arcKmFromChordKm(result.guess.distanceKm) : result.guess.distanceKm)}
            </Text>
            <Text
              style={[
                styles.rowPoints,
                { color: feedbackColor(colors, result.score.distancePoints, ROW_MAX_POINTS.distance) },
              ]}
            >
              +{result.score.distancePoints}
            </Text>
          </View>
        </View>
      ))}

      <Button label={isLastRound ? LAST_LABEL : NEXT_LABEL} onPress={onNext} />
    </Card>
  );
};
