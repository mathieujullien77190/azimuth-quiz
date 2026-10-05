import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { BACKDROP_COLOR } from './constants';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: BACKDROP_COLOR,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    question: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    answers: {
      gap: spacing.sm,
    },
    answer: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    answerLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });
