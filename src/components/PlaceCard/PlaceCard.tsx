import { StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { categoryEmoji } from './helpers';
import type { PlaceCardProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
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

export const PlaceCard = ({ place, originName, showCountry }: PlaceCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
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
