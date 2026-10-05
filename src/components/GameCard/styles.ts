import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { CARD_MIN_HEIGHT } from './constants';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Big, and of a fixed size: the home screen puts the two cards at the bottom of the screen, they do not stretch.
    card: {
      minHeight: CARD_MIN_HEIGHT,
      padding: spacing.lg,
      gap: spacing.md,
      justifyContent: 'space-between',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontSize: 32,
    },
    title: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.title - 4,
      flexShrink: 1,
    },
    tagline: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body + 1,
      lineHeight: 22,
    },
    players: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });
