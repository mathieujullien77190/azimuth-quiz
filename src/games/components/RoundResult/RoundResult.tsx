import { useCallback, useState } from 'react';
import { Linking, Text, View, useWindowDimensions } from 'react-native';
import { formatBearing, formatDistance, formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Player, Theme } from '@/types';

import Card from '@/components/ui/Card';
import MiniButton from '@/components/ui/MiniButton';
import Spinner from '@/components/ui/Spinner';
import { COMPACT_MAX_WIDTH } from './constants';
import { formatRowScore } from './helpers';
import type { RoundResultProps } from './types';

import { createStyles } from './styles';

export const RoundResult = ({ record, players, totals, answered, localIndex, onKick }: RoundResultProps) => {
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_MAX_WIDTH;
  const styles = useThemedStyles(useCallback((theme: Theme) => createStyles(theme, compact), [compact]));
  const { colors } = useTheme();
  const t = useTranslation();
  const { score: truth } = record.results[0];
  const isSolo = players.length === 1;
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const pending = answered !== undefined;

  // En ligne : un joueur parti pendant le reveal retrecit `players` mais pas `record.results` ; on ecarte
  // les entrees sans joueur.
  const entries = record.results
    .map((result, index) => ({ result, player: players[index], index }))
    .filter(
      (entry): entry is { result: (typeof record.results)[number]; player: Player; index: number } =>
        entry.player !== undefined,
    );
  // Classement par points de la manche ; en attente (pas de score officiel), l'entree de cet appareil passe
  // en premier, le reste dans l'ordre d'arrivee.
  const ranked = pending
    ? localIndex === undefined
      ? entries
      : [...entries.filter((e) => e.index === localIndex), ...entries.filter((e) => e.index !== localIndex)]
    : entries.sort((a, b) => b.result.score.total - a.result.score.total);

  return (
    <Card style={styles.card}>
      <View style={styles.truth}>
        <View style={styles.truthHead}>
          <View style={[styles.truthDot, { backgroundColor: colors.truth }]} />
          <Text style={styles.truthLabel}>{t.roundResult.truth}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{t.roundResult.direction}</Text>
          <Text style={styles.truthValue}>{pending ? '' : formatBearing(truth.trueBearing, t.cardinals)}</Text>
        </View>
        <View style={styles.truthRow}>
          <Text style={styles.truthRowLabel}>{t.roundResult.distance}</Text>
          <Text style={styles.truthValue}>{pending ? '' : formatDistance(truth.trueSurfaceDistanceKm)}</Text>
        </View>
        <MiniButton
          label={t.roundResult.scoringInfoLabel}
          onPress={() => setShowScoringInfo((value) => !value)}
          style={styles.miniButtonSpacing}
        />
        {showScoringInfo && (
          <Text style={styles.scoringInfo}>
            {t.roundResult.scoringInfoBefore}
            <Text style={styles.scoringLink} onPress={() => Linking.openURL(t.roundResult.rhumbLineUrl)}>
              {t.roundResult.rhumbLineLabel}
            </Text>
            {t.roundResult.scoringInfoAfter}
          </Text>
        )}
      </View>

      {ranked.map(({ result, player, index }, position) => {
        const hasAnswered = !pending || answered[index];
        return (
          <View key={player.name + position} style={[styles.player, position > 0 && styles.playerBorder]}>
            <View style={styles.playerHead}>
              {!isSolo &&
                (pending && !hasAnswered ? (
                  <Spinner color={player.color} />
                ) : (
                  <View style={[styles.playerDot, { backgroundColor: player.color }]}>
                    {pending && <Text style={styles.playerDotCheck}>✓</Text>}
                  </View>
                ))}
              <Text style={styles.playerName}>{isSolo ? t.roundResult.yourScore : player.name}</Text>
              <View style={styles.scoreBlock}>
                <Text style={styles.playerTotal}>{formatNumber(totals[index])}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t.roundResult.direction}</Text>
              <Text style={styles.rowValue}>
                {pending
                  ? hasAnswered && formatBearing(result.guess.bearing, t.cardinals)
                  : [
                      formatBearing(result.guess.bearing, t.cardinals),
                      ' ',
                      result.score.directionExactBonus > 0 ? (
                        <Text key="perfect" style={{ color: colors.success }}>
                          {t.roundResult.perfect}
                        </Text>
                      ) : (
                        `(+${Math.round(result.score.directionError)}°)`
                      ),
                    ]}
                {pending && !hasAnswered && '?'}
              </Text>
              <Text
                style={[
                  styles.rowPoints,
                  {
                    color:
                      !pending && (result.score.directionBonus > 0 || result.score.directionExactBonus > 0)
                        ? colors.success
                        : colors.text,
                  },
                ]}
              >
                {pending
                  ? '?'
                  : formatRowScore(
                      result.score.directionPoints,
                      result.score.directionBonus + result.score.directionExactBonus,
                    )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t.roundResult.distance}</Text>
              <Text style={styles.rowValue}>
                {pending
                  ? hasAnswered && formatDistance(result.guess.distanceKm)
                  : [
                      formatDistance(result.guess.distanceKm),
                      ' ',
                      result.score.distanceExactBonus > 0 && result.score.directionExactBonus > 0 ? (
                        <Text key="perfect" style={{ color: colors.success }}>
                          {t.roundResult.perfect}
                        </Text>
                      ) : (
                        `(🎯 ${formatDistance(result.score.targetGapKm)})`
                      ),
                    ]}
                {pending && !hasAnswered && '?'}
              </Text>
              <Text
                style={[
                  styles.rowPoints,
                  {
                    color:
                      !pending && (result.score.distanceBonus > 0 || result.score.distanceExactBonus > 0)
                        ? colors.success
                        : colors.text,
                  },
                ]}
              >
                {pending
                  ? '?'
                  : formatRowScore(
                      result.score.distancePoints,
                      result.score.distanceBonus + result.score.distanceExactBonus,
                    )}
              </Text>
            </View>
            <View style={styles.roundTotalRow}>
              <Text style={styles.roundScore}>{pending ? '?' : `+${formatNumber(result.score.total)}`}</Text>
            </View>
            {onKick && index !== localIndex && (
              <MiniButton
                label={t.setup.online.kick}
                onPress={() => onKick(index)}
                style={styles.miniButtonSpacing}
                variant="danger"
              />
            )}
          </View>
        );
      })}
    </Card>
  );
};
