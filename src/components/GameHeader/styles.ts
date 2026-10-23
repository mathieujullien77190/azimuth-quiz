import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
    // Look de panneau flottant pour l'en-tete de chaque jeu : `surfaceHigh`/`surface` a ~94 % d'opacite (`F0`)
    // donne un panneau releve dans les deux themes, assez translucide pour ne pas faire barre pleine.
    header: {
      backgroundColor: isDark ? `${colors.surfaceHigh}F0` : `${colors.surface}F0`,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    // La croix et, juste a cote, le code de la room.
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    code: {
      ...typography.label,
      color: colors.text,
      fontSize: fontSize.body + 2,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body + 2,
    },
    // "Manche 3 / 10 · 🟡 Moyen", sur une ligne alignee a gauche.
    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    separator: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    // Mode voyage : ou se trouve le joueur, en blanc, aligne a gauche comme la ligne de manche.
    location: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body + 2,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
  });
