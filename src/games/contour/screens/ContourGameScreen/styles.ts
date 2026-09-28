import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, radius, typography }: Theme) =>
  StyleSheet.create({
    // 'reveal' phase's own footer: score alongside the "Manche suivante"/"Voir le score" button,
    // rather than up in the header next to "Quitter" (see `Screen`'s `footer` prop below).
    revealFooter: {
      gap: spacing.sm,
      alignItems: 'center',
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    countryCard: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    countryName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    // Flag emoji needs its own font family: Chromium on Windows has no system font that renders
    // flag emoji as flags, falling back to the raw two-letter code (e.g. "ES") instead — see
    // FLAG_FONT_FAMILY's own doc comment. Doesn't apply to the country name right next to it.
    flagEmoji: {
      fontFamily: FLAG_FONT_FAMILY,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    // 'reveal' only ('guess' uses `fullBleedBoardArea` instead, see above): `flex: 1` so
    // this card claims whatever's left of the ScrollView's own height once its siblings (the
    // country card above, the results card below) have taken theirs — see `boardArea`, measured
    // inside it, for the actual live sizing.
    // The board's actual "available space" measurement (see `onBoardAreaLayout`): stretches to
    // the screen's full width and claims the rest of its height.
    // Centered so the board (typically smaller than this box on one axis, once fit to the
    // country's own aspect ratio) doesn't just stick to a corner.
    boardArea: {
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Frames the board's exact touch/drawable rectangle: no explicit width/height on purpose, so
    // it shrink-wraps ContourBoard's own `width` x `height` View exactly.
    boardFrame: {
      alignSelf: 'center',
    },
    resultsList: {
      gap: spacing.sm,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    resultRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    resultDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    resultTexts: {
      flex: 1,
      gap: 2,
    },
    resultName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    resultPoints: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
    },
    guessFooter: {
      gap: spacing.sm + 2,
    },
    wrongGuessText: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
      color: colors.danger,
    },
    // Shown on the attribution overlay below for a correct guess (its wrong counterpart reuses
    // `wrongGuessText` above) — unlike Clues, Contour's overlay covers both outcomes: the
    // penalty/reward still needs a player picked either way, so there's no way to skip it on a
    // miss the way Clues does.
    resultOkText: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
      color: colors.success,
    },
    // Post-"Valider" step (see `validateGuess`/`pendingCorrect`): covers the entire screen, same
    // pattern as ClueGameScreen's own attribution overlay — mostly opaque (hex alpha suffix),
    // just enough transparency to hint the board/hints are still there behind it.
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
