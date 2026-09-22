import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, formatBearing, formatDistance, formatInclination, formatNumber } from '@/helpers';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { ROW_LABELS, TRUTH_LABEL } from './constants';
import { formatRowScore } from './helpers';
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
    truthHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    truthDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    truthLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
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
    // Meme style que la valeur d'une reponse de joueur (rowValue) : la verite n'a pas a se
    // distinguer par la couleur ou la taille, seule sa place tout en haut du bloc la signale.
    truthValue: {
      ...typography.body,
      color: colors.text,
      fontSize: fontSize.body - 1,
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
    scoreBlock: {
      alignItems: 'flex-end',
    },
    playerTotal: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
    },
    // Score de la manche, sous le score general : plus petit, meme alignement a droite.
    roundScore: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption - 1,
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

export const RoundResult = ({ record, players, totals, options }: RoundResultProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { score: truth } = record.results[0];
  const isSolo = players.length === 1;

  // Les joueurs sont classes par points sur la manche (le meilleur en premier).
  const ranked = record.results
    .map((result, index) => ({ result, player: players[index], index }))
    .sort((a, b) => b.result.score.total - a.result.score.total);

  // Le curseur donne la corde (ligne droite) en mode straightLine ; la distance de surface
  // equivalente sert a la fois a l'affichage et au calcul de l'ecart avec la vraie reponse.
  const guessSurfaceKmFor = (result: (typeof record.results)[number]): number =>
    options.straightLine ? arcKmFromChordKm(result.guess.distanceKm) : result.guess.distanceKm;

  return (
    <Card style={styles.card}>
      <View style={styles.truth}>
        <View style={styles.truthHead}>
          <View style={[styles.truthDot, { backgroundColor: colors.truth }]} />
          <Text style={styles.truthLabel}>{TRUTH_LABEL}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{ROW_LABELS.direction}</Text>
          <Text style={styles.truthValue}>{formatBearing(truth.trueBearing)}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{ROW_LABELS.distance}</Text>
          <Text style={styles.truthValue}>{formatDistance(truth.trueSurfaceDistanceKm)}</Text>
        </View>
        {options.straightLine && (
          <View style={styles.truthRow}>
            <Text style={styles.truthRowLabel}>{ROW_LABELS.inclination}</Text>
            <Text style={styles.truthValue}>{formatInclination(truth.trueInclination)}</Text>
          </View>
        )}
      </View>

      {ranked.map(({ result, player, index }, position) => (
        <View key={player.name + position} style={[styles.player, position > 0 && styles.playerBorder]}>
          <View style={styles.playerHead}>
            {!isSolo && <View style={[styles.playerDot, { backgroundColor: player.color }]} />}
            <Text style={styles.playerName}>{isSolo ? 'Ton score' : player.name}</Text>
            <View style={styles.scoreBlock}>
              <Text style={styles.playerTotal}>{formatNumber(totals[index])}</Text>
              <Text style={styles.roundScore}>{formatNumber(result.score.total)}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{ROW_LABELS.direction}</Text>
            <Text style={styles.rowValue}>
              {formatBearing(result.guess.bearing)} (+{Math.round(result.score.directionError)}°)
            </Text>
            <Text style={[styles.rowPoints, { color: result.score.directionBonus > 0 ? colors.success : colors.text }]}>
              {formatRowScore(result.score.directionPoints, result.score.directionBonus)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{ROW_LABELS.distance}</Text>
            <Text style={styles.rowValue}>
              {formatDistance(guessSurfaceKmFor(result))} (+
              {formatDistance(Math.abs(guessSurfaceKmFor(result) - truth.trueSurfaceDistanceKm))})
            </Text>
            <Text style={[styles.rowPoints, { color: result.score.distanceBonus > 0 ? colors.success : colors.text }]}>
              {formatRowScore(result.score.distancePoints, result.score.distanceBonus)}
            </Text>
          </View>
          {options.straightLine && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{ROW_LABELS.inclination}</Text>
              <Text style={styles.rowValue}>{formatInclination(result.guess.inclination)}</Text>
              {/* Meme score que Distance : en mode ligne droite, la corde jugee par distancePoints
                  EST l'inclinaison (l'une determine l'autre) — donc le meme pool de points, gagne
                  et perdu ensemble, independamment du cap. */}
              <Text style={[styles.rowPoints, { color: result.score.distanceBonus > 0 ? colors.success : colors.text }]}>
                {formatRowScore(result.score.distancePoints, result.score.distanceBonus)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </Card>
  );
};
