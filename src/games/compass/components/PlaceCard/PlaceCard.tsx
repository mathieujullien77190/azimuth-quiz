import { memo } from 'react';
import { Linking, Pressable, Text } from 'react-native';
import { countryName } from '@/data/places/countries';
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
  // The trivia only exists in French (never translated): we don't show it in English rather
  // than displaying text in the wrong language. The Wikipedia link, though, stays bilingual.
  const showDescription = revealed && language === 'fr';
  // The Wikipedia link only makes sense on reveal (never while guessing): same guard
  // as the reveal itself, rather than a separate prop to keep in sync.
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
});
