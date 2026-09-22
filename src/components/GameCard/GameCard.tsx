import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import Button from '../ui/Button';
import Card from '../ui/Card';
import type { GameCardProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm + 2,
    },
    disabled: {
      opacity: 0.55,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 22,
    },
    title: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
      flexShrink: 1,
    },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body - 1,
      lineHeight: 19,
    },
    meta: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption - 2,
    },
    note: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });

export const GameCard = ({ icon, title, tagline, meta, note, ctaLabel, onPress, disabled = false }: GameCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={[styles.card, disabled && styles.disabled]}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.tagline}>{tagline}</Text>
      <Text style={styles.meta}>{meta.join('   ·   ')}</Text>
      {note !== undefined && <Text style={styles.note}>{note}</Text>}
      <Button disabled={disabled} label={ctaLabel} onPress={onPress} variant={disabled ? 'ghost' : 'primary'} />
    </Card>
  );
};
