import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useTranslation } from '@/i18n';
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
    toggle: {
      marginTop: spacing.sm,
    },
    toggleLabel: {
      ...typography.label,
      color: colors.accent,
      fontSize: fontSize.caption,
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });

/** Repliee par defaut, meme quand `description` est fournie : un clic la deplie. */
export const PlaceCard = ({ place, originName, showCountry, description }: PlaceCardProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.card}>
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.name}>
        {place.name}
      </Text>
      <Text style={styles.country}>
        {categoryEmoji(place.category)}
        {showCountry ? ` ${place.country}` : ''}
      </Text>
      <Text style={styles.hint}>{t.placeCard.hintFrom(originName)}</Text>

      {description !== undefined && (
        <>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setExpanded((value) => !value)} style={styles.toggle}>
            <Text style={styles.toggleLabel}>{expanded ? t.placeCard.hideDescription : t.placeCard.showDescription}</Text>
          </Pressable>
          {expanded && <Text style={styles.description}>{description}</Text>}
        </>
      )}
    </Card>
  );
};
