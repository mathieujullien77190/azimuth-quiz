import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    names: {
      gap: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    // Conteneur du champ : positionne les initiales dedans, jamais en frere qui pourrait pousser la rangee hors ecran.
    inputWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    input: {
      ...typography.heading,
      minHeight: 44,
      paddingLeft: spacing.md,
      paddingRight: 46,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Comme `input`, mais laisse de la place a droite pour le badge d'initiales ET le mini bouton « Expulser »
    // (voir `removeButton`).
    inputWithRemove: {
      paddingRight: 128,
    },
    initials: {
      position: 'absolute',
      right: spacing.xs + 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    initialsText: {
      ...typography.label,
      fontSize: fontSize.caption,
    },
    // A gauche de `initials` (meme positionnement absolu a droite), dans la meme boite de champ.
    removeButton: {
      position: 'absolute',
      right: spacing.xs + 2 + 28 + spacing.sm,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    error: {
      ...typography.body,
      color: colors.danger,
      fontSize: fontSize.caption + 1,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    coordInputWrap: {
      justifyContent: 'center',
    },
    coordInput: {
      ...typography.heading,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Code de room en cours de generation : le placeholder du champ le dit deja, ceci n'est que le spinner a cote,
    // a la place du badge d'initiales du joiner.
    coordSpinner: {
      position: 'absolute',
      right: spacing.md,
    },
  });
