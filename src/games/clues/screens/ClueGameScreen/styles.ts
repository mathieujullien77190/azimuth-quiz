import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
      textAlign: 'center',
    },
    standingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    standingRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    standingRank: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
      width: 24,
    },
    standingName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      flex: 1,
    },
    standingScore: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
    },
    header: {
      // White by day rather than the page's own light-blue background (see Screen's footer,
      // same fix): a fixed bar reads better as its own surface than a washed-out page extension.
      backgroundColor: isDark ? colors.background : colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    quit: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    skeletonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: spacing.xl,
      marginBottom: spacing.md,
    },
    skeletonWord: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    skeletonSlot: {
      width: 18,
      height: 26,
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    skeletonLetter: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    // Typed-in letters (not revealed by any clue) stand out from clue-revealed ones by color
    // alone, same size — see the live overlay above the typed-answer input.
    skeletonLetterTyped: {
      ...typography.display,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    // The round's own live/countdown score (see `remaining`): distinct from the top-right
    // header, which now shows each player's real cumulative total instead.
    pointsAtStake: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    // Same 10px gap as buzzPanel (spacing.sm + 2), for even spacing between the footer's own
    // top-level elements (points-at-stake text, then the actions/buzz panel/result banner).
    footerContent: {
      gap: spacing.sm + 2,
    },
    resultBanner: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
    },
    resultCorrect: {
      color: colors.success,
    },
    resultWrong: {
      color: colors.danger,
    },
    revealAnswer: {
      ...typography.heading,
      textAlign: 'center',
      color: colors.text,
      fontSize: fontSize.body,
    },
    revealSub: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: fontSize.caption,
      marginTop: 2,
    },
    actions: {
      gap: spacing.sm,
    },
    buzzRow: {
      gap: spacing.sm,
    },
    guessInput: {
      ...typography.heading,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Typed mode's post-"Valider" step: covers the entire screen (see the component's own
    // return, rendered as a sibling of `Screen` rather than inside its footer). Mostly opaque
    // (hex alpha suffix, same trick as ContourGameScreen's own overlays), just enough transparency
    // to hint the board/round is still there behind it.
    attributeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${colors.background}E6`,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.lg,
    },
    attributePrompt: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    attributeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    attributeButton: {
      minWidth: 110,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      borderWidth: 2,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
    },
    attributeButtonText: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
  });
