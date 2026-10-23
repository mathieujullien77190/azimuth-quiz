import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

const SWATCH_SIZE = 36;
const NAME_COLUMN_WIDTH = 300;
const THEME_COLUMN_WIDTH = 170;

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
    },
    table: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    nameColumn: {
      width: NAME_COLUMN_WIDTH,
      gap: 2,
    },
    themeColumn: {
      width: THEME_COLUMN_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerText: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    headerCurrent: {
      color: colors.accent,
    },
    tokenName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    swatch: {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hex: {
      ...typography.body,
      color: colors.text,
      fontSize: fontSize.caption + 1,
    },
  });
