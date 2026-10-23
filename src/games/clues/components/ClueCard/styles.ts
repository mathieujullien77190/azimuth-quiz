import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { Theme } from '@/types';
import { COMPASS_CLUE_SIZE, EARTH_CLUE_SIZE, GLOBE_CLUE_SIZE } from './constants';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    // Pas de maxWidth : flexGrow doit pouvoir etirer une carte seule sur sa ligne (avant une carte `wide`).
    card: {
      flexBasis: '48%',
      flexGrow: 1,
      minHeight: 96,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
    },
    locked: {
      opacity: 0.7,
    },
    revealed: {
      borderColor: colors.accent,
    },
    wide: {
      flexBasis: '100%',
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption - 1,
    },
    stageDots: {
      flexDirection: 'row',
      gap: 4,
    },
    stageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    stageDotFilled: {
      backgroundColor: colors.accent,
    },
    body: {
      height: 42,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bodyCompass: {
      height: COMPASS_CLUE_SIZE + spacing.sm,
    },
    bodyEarth: {
      height: EARTH_CLUE_SIZE + spacing.xl,
    },
    bodyGlobe: {
      height: GLOBE_CLUE_SIZE + spacing.md,
    },
    bodyFlag: {
      height: 78,
    },
    // Une phrase de jeu de mots ne tient pas dans les 42px fixes des autres corps de carte.
    bodyWordplay: {
      height: undefined,
      minHeight: 42,
      paddingVertical: spacing.xs,
    },
    wordplaySentence: {
      ...typography.body,
      color: colors.text,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    // Difficulte propre au jeu de mots : simple pastille dans l'en-tete, a la place de `stageDots`.
    wordplayDifficulty: {
      fontSize: fontSize.caption,
    },
    personalityName: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    lockIcon: {
      fontSize: 22,
    },
    bigEmoji: {
      fontSize: 28,
    },
    flagEmoji: {
      fontFamily: FLAG_FONT_FAMILY,
      fontSize: 40,
    },
    populationDotRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    populationDot: {
      borderRadius: 999,
    },
    statValue: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
      textAlign: 'center',
    },
    // Un Text par mot dans une rangee qui passe a la ligne : evite de compter sur une espace litterale.
    letterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    // Variante plus petite/espacee de statValue : le texte de l'indice "letter" peut etre long.
    letterValue: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
      letterSpacing: 1,
      textAlign: 'center',
    },
    statUnit: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption - 2,
      marginTop: 2,
      textAlign: 'center',
    },
    positionBox: {
      width: 40,
      height: 40,
      borderRadius: radius.sm - 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    positionDot: {
      position: 'absolute',
      width: 10,
      height: 10,
      marginLeft: -5,
      marginTop: -5,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    flagColorList: {
      gap: spacing.xs,
      width: '100%',
      alignItems: 'center',
    },
    flagColorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    flagSwatch: {
      width: 16,
      height: 16,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    flagColorPercent: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption + 1,
      minWidth: 30,
    },
    emojiSlotRow: {
      flexDirection: 'row',
      gap: spacing.xs + 2,
    },
    emojiSlotShown: {
      fontSize: 22,
    },
    emojiSlotHidden: {
      fontSize: 18,
      color: colors.textMuted,
      opacity: 0.6,
    },
    distanceWrap: {
      width: '100%',
      alignItems: 'center',
      position: 'relative',
    },
    distanceOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    distanceBadge: {
      minWidth: 34,
      minHeight: 26,
      paddingHorizontal: spacing.xs + 2,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    distanceBadgeText: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.caption + 1,
    },
  });
