import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Card from '../Card';
import type { SectionProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
  });

/** Carte titree : regroupe les champs d'un meme sujet. */
const Section = ({ title, hint, children }: SectionProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
    </Card>
  );
};

export default Section;
