import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { countryCodeToFlag } from '@/helpers';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { MAX_PROGRESS_DOTS, ROUND_LABEL } from './constants';
import { categoryEmoji, formatRoundProgress } from './helpers';
import type { PlaceCardProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    topRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    badge: {
      backgroundColor: colors.surfaceHigh,
      borderRadius: radius.button,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    badgeText: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    progress: {
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
    player: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
      marginBottom: spacing.xs,
    },
    playerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    playerName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    flag: {
      fontSize: 44,
    },
    name: {
      ...typography.display,
      color: colors.text,
      fontSize: fontSize.display,
      maxWidth: '100%',
      textAlign: 'center',
    },
    country: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });

export const PlaceCard = ({ place, roundNumber, totalRounds, originName, player, showCountry }: PlaceCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {ROUND_LABEL} {formatRoundProgress(roundNumber, totalRounds)}
          </Text>
        </View>
        {totalRounds <= MAX_PROGRESS_DOTS && (
          <View style={styles.progress}>
            {Array.from({ length: totalRounds }, (_, index) => (
              <View key={index} style={[styles.dot, index < roundNumber && styles.dotDone]} />
            ))}
          </View>
        )}
      </View>

      {player !== undefined && (
        <View style={styles.player}>
          <View style={[styles.playerDot, { backgroundColor: player.color }]} />
          <Text style={styles.playerName}>{player.name}</Text>
        </View>
      )}

      <Text style={styles.flag}>{countryCodeToFlag(place.code)}</Text>
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
        {place.name}
      </Text>
      <Text style={styles.country}>
        {categoryEmoji(place.category)}
        {showCountry ? ` ${place.country}` : ''}
      </Text>
      <Text style={styles.hint}>Depuis {originName} : quel cap, quelle distance ?</Text>
    </Card>
  );
};
