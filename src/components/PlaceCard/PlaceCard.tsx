import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { countryName } from '@/constants/places/countries';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../ui/Card';
import { categoryEmoji, wikiUrl } from './helpers';
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
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    wikiBadge: {
      marginTop: spacing.sm,
      minHeight: 24,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wikiBadgeText: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
  });

export const PlaceCard = ({ place, showCountry, description }: PlaceCardProps) => {
  const styles = useThemedStyles(createStyles);
  const { language } = useLanguage();
  const t = useTranslation();
  const revealed = description !== undefined;
  // L'anecdote n'existe qu'en francais (jamais traduite) : on ne l'affiche pas en anglais plutot
  // que de montrer un texte dans la mauvaise langue. Le lien Wikipedia, lui, reste bilingue.
  const showDescription = revealed && language === 'fr';
  // Le lien Wikipedia n'a de sens qu'a la revelation (jamais pendant qu'on devine) : meme garde
  // que la revelation elle-meme, plutot qu'un prop separe a synchroniser.
  const url = revealed ? wikiUrl(place, language) : undefined;

  return (
    <Card style={styles.card}>
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
        {place.name}
      </Text>
      <Text style={styles.country}>
        {categoryEmoji(place.category)}
        {showCountry ? ` ${countryName(place.code, language)}` : ''}
      </Text>
      {showDescription && <Text style={styles.description}>{description}</Text>}
      {url !== undefined && (
        <Pressable
          accessibilityLabel={t.placeCard.wikiLabel}
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => Linking.openURL(url)}
          style={styles.wikiBadge}
        >
          <Text style={styles.wikiBadgeText}>wiki</Text>
        </Pressable>
      )}
    </Card>
  );
};
