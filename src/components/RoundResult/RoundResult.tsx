import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { arcKmFromChordKm, formatBearing, formatDistance, formatInclination, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { COMPACT_FONT_SCALE, COMPACT_MAX_WIDTH } from './constants';
import { formatRowScore } from './helpers';
import type { RoundResultProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme, compact: boolean) => {
  const scale = compact ? COMPACT_FONT_SCALE : 1;
  return StyleSheet.create({
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
      fontSize: fontSize.subtitle * scale,
    },
    scoringToggle: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
    scoringToggleText: {
      ...typography.label,
      color: colors.accent,
      fontSize: fontSize.caption * scale,
    },
    scoringInfo: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: (fontSize.caption + 1) * scale,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    truthRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    truthRowLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption * scale,
      width: 90,
    },
    // Same style as a player's answer value (rowValue): the truth doesn't need to
    // stand out by color or size, only its place at the very top of the block signals it.
    truthValue: {
      ...typography.body,
      color: colors.text,
      fontSize: (fontSize.body - 1) * scale,
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
      fontSize: fontSize.subtitle * scale,
    },
    scoreBlock: {
      alignItems: 'flex-end',
    },
    playerTotal: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title * scale,
    },
    // Round score, below the detail rows: same size/weight as rowPoints, in white.
    roundTotalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    roundScore: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body * scale,
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
      fontSize: fontSize.caption * scale,
      width: 90,
    },
    rowValue: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      fontSize: (fontSize.body - 1) * scale,
    },
    rowPoints: {
      ...typography.heading,
      fontSize: fontSize.body * scale,
    },
  });
};

export const RoundResult = ({ record, players, totals, options }: RoundResultProps) => {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_MAX_WIDTH;
  const styles = useThemedStyles(useCallback((theme: Theme) => createStyles(theme, compact), [compact]));
  const { colors } = useTheme();
  const t = useTranslation();
  const { score: truth } = record.results[0];
  const isSolo = players.length === 1;
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  // Players are ranked by points on the round (best first).
  const ranked = record.results
    .map((result, index) => ({ result, player: players[index], index }))
    .sort((a, b) => b.result.score.total - a.result.score.total);

  // The slider gives the chord (straight line) in straightLine mode; the equivalent
  // surface distance is used both for display and to compute the gap with the true answer.
  const guessSurfaceKmFor = (result: (typeof record.results)[number]): number =>
    options.straightLine ? arcKmFromChordKm(result.guess.distanceKm) : result.guess.distanceKm;

  return (
    <Card style={styles.card}>
      <View style={styles.truth}>
        <View style={styles.truthHead}>
          <View style={[styles.truthDot, { backgroundColor: colors.truth }]} />
          <Text style={styles.truthLabel}>{t.roundResult.truth}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{t.roundResult.direction}</Text>
          <Text style={styles.truthValue}>{formatBearing(truth.trueBearing, t.cardinals)}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{t.roundResult.distance}</Text>
          <Text style={styles.truthValue}>{formatDistance(truth.trueSurfaceDistanceKm)}</Text>
        </View>
        {options.straightLine && (
          <View style={styles.truthRow}>
            <Text style={styles.truthRowLabel}>{t.roundResult.inclination}</Text>
            <Text style={styles.truthValue}>{formatInclination(truth.trueInclination)}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setShowScoringInfo((value) => !value)}
          style={styles.scoringToggle}
        >
          <Text style={styles.scoringToggleText}>{t.roundResult.scoringInfoLabel}</Text>
        </Pressable>
        {showScoringInfo && <Text style={styles.scoringInfo}>{t.roundResult.scoringInfo}</Text>}
      </View>

      {ranked.map(({ result, player, index }, position) => (
        <View key={player.name + position} style={[styles.player, position > 0 && styles.playerBorder]}>
          <View style={styles.playerHead}>
            {!isSolo && <View style={[styles.playerDot, { backgroundColor: player.color }]} />}
            <Text style={styles.playerName}>{isSolo ? t.roundResult.yourScore : player.name}</Text>
            <View style={styles.scoreBlock}>
              <Text style={styles.playerTotal}>{formatNumber(totals[index])}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.roundResult.direction}</Text>
            <Text style={styles.rowValue}>
              {formatBearing(result.guess.bearing, t.cardinals)}{' '}
              {result.score.directionExactBonus > 0 ? (
                <Text style={{ color: colors.success }}>{t.roundResult.perfect}</Text>
              ) : (
                `(+${Math.round(result.score.directionError)}°)`
              )}
            </Text>
            <Text
              style={[
                styles.rowPoints,
                { color: result.score.directionBonus > 0 || result.score.directionExactBonus > 0 ? colors.success : colors.text },
              ]}
            >
              {formatRowScore(result.score.directionPoints, result.score.directionBonus + result.score.directionExactBonus)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.roundResult.distance}</Text>
            <Text style={styles.rowValue}>
              {formatDistance(guessSurfaceKmFor(result))}{' '}
              {result.score.distanceExactBonus > 0 ? (
                <Text style={{ color: colors.success }}>{t.roundResult.perfect}</Text>
              ) : (
                `(+${formatDistance(Math.abs(guessSurfaceKmFor(result) - truth.trueSurfaceDistanceKm))})`
              )}
            </Text>
            <Text
              style={[
                styles.rowPoints,
                { color: result.score.distanceBonus > 0 || result.score.distanceExactBonus > 0 ? colors.success : colors.text },
              ]}
            >
              {formatRowScore(result.score.distancePoints, result.score.distanceBonus + result.score.distanceExactBonus)}
            </Text>
          </View>
          {options.straightLine && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t.roundResult.inclination}</Text>
              <Text style={styles.rowValue}>{formatInclination(result.guess.inclination)}</Text>
              {/* Same score as Distance: in straight-line mode, the chord judged by distancePoints
                  IS the inclination (one determines the other) — so the same points pool, won
                  and lost together, independent of the heading. */}
              <Text
                style={[
                  styles.rowPoints,
                  { color: result.score.distanceBonus > 0 || result.score.distanceExactBonus > 0 ? colors.success : colors.text },
                ]}
              >
                {formatRowScore(result.score.distancePoints, result.score.distanceBonus + result.score.distanceExactBonus)}
              </Text>
            </View>
          )}
          <View style={styles.roundTotalRow}>
            <Text style={styles.roundScore}>+{formatNumber(result.score.total)}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
};
