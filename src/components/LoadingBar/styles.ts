import { StyleSheet } from 'react-native';

import { fontSize, HOME_FOOTER_HEIGHT, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
    screen: {
      ...StyleSheet.absoluteFill,
      zIndex: 1000,
      backgroundColor: colors.background,
    },
    // Meme padding qu'un `Screen` (zone de securite + contenu), pour que le titre soit exactement a sa position
    // de l'accueil.
    layout: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    // Sous le titre : le cadran au milieu de la place restante, le pied en bas.
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      gap: spacing.md,
    },
    // Meme hauteur que le pied de l'accueil (ses boutons) pour que la boussole reste a sa place.
    footer: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.md,
      height: HOME_FOOTER_HEIGHT,
    },
    track: {
      alignSelf: 'stretch',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    fill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: isDark ? colors.accent : colors.accentDark,
    },
    // Libelle « chargement » et, a cote, pourcentage de la barre.
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    loading: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      letterSpacing: 3,
    },
    // Ligne de version entiere, jamais coupee : centree, lisible, elle peut passer sur 2 lignes sur petit telephone.
    version: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
      alignSelf: 'stretch',
    },
  });
