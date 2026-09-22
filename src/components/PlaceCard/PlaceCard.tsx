import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { categoryEmoji } from './helpers';
import type { PlaceCardProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
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

export const PlaceCard = ({ place, originName, player, showCountry }: PlaceCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      {player !== undefined && (
        <View style={styles.player}>
          <View style={[styles.playerDot, { backgroundColor: player.color }]} />
          <Text style={styles.playerName}>{player.name}</Text>
        </View>
      )}

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
