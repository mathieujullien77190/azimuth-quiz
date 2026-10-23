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
    // Espacement autour des `MiniButton` (le bouton n'en porte pas).
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
    scoringLink: {
      color: colors.accent,
      textDecorationLine: 'underline',
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
    // Meme style que la valeur d'une reponse : la verite se repere a sa place tout en haut.
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
