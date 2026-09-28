import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';
import { COMPACT_FONT_SCALE } from './constants';

export const createStyles = ({ colors, radius, typography }: Theme, compact: boolean) => {
  const scale = compact ? COMPACT_FONT_SCALE : 1;
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    truth: {
      gap: 2,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
    },
    truthHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 2,
    },
    truthDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    truthLabel: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle * scale,
    },
    // Spacing around the `MiniButton`s (scoring info, kick) — the button itself carries none.
    miniButtonSpacing: {
      marginTop: spacing.md,
    },
    scoringInfo: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: (fontSize.caption + 1) * scale,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    truthRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    truthRowLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption * scale,
      width: 90,
    },
    // Same style as a player's answer value (rowValue): the truth doesn't need to
    // stand out by color or size, only its place at the very top of the block signals it.
    truthValue: {
      ...typography.body,
      color: colors.text,
      fontSize: (fontSize.body - 1) * scale,
    },
    player: {
      gap: spacing.xs,
    },
    playerBorder: {
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    playerHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    playerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerDotCheck: {
      color: colors.onAccent,
      fontSize: 8,
      fontWeight: '700',
    },
    playerName: {
      ...typography.heading,
      flex: 1,
      color: colors.text,
      fontSize: fontSize.subtitle * scale,
    },
    scoreBlock: {
      alignItems: 'flex-end',
    },
    playerTotal: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title * scale,
    },
    // Round score, below the detail rows: same size/weight as rowPoints, in white.
    roundTotalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    roundScore: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body * scale,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    rowLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption * scale,
      width: 90,
    },
    rowValue: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      fontSize: (fontSize.body - 1) * scale,
    },
    rowPoints: {
      ...typography.heading,
      fontSize: fontSize.body * scale,
    },
  });
};
