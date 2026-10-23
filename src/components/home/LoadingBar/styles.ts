import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark, typography }: Theme) =>
  StyleSheet.create({
    // Tient la place des boutons de l'accueil : contenu colle en bas du pied.
    footer: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.md,
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
