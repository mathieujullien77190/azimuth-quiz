import { memo } from 'react';
import { Linking, Pressable, Text } from 'react-native';
import { useLanguage, useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Card from '@/components/ui/Card';
import { categoryEmoji, wikiUrl } from './helpers';
import type { PlaceCardProps } from './types';

import { createStyles } from './styles';

export const PlaceCard = memo(function PlaceCard({ place, showCountry, description }: PlaceCardProps) {
  const styles = useThemedStyles(createStyles);
  const { language } = useLanguage();
  const t = useTranslation();
  const revealed = description !== undefined;
  // L'anecdote n'existe qu'en francais : masquee en anglais. Le lien Wikipedia reste bilingue.
  const showDescription = revealed && language === 'fr';
  // Lien Wikipedia seulement au reveal (meme garde que le reveal, pas de prop a synchroniser).
  const url = revealed ? wikiUrl(place, language) : undefined;

  return (
    <Card style={styles.card}>
      <Text style={styles.name}>
        {place.name}
      </Text>
      <Text style={styles.country}>
        {categoryEmoji(place.category)}
        {showCountry ? ` ${place.country?.[language] ?? place.code}` : ''}
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
});
