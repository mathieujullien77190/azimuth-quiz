import { StyleSheet } from 'react-native';

import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';

import { MIN_TOUCH_SIZE, TOGGLE_SIZE } from './constants';

export const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    // Flotte juste au-dessus du footer (`bottom: '100%'`), a son coin droit : hors de son flux, donc les boutons du
    // footer gardent leur largeur. La colonne pend de ce bouton (voir `column`).
    bar: {
      position: 'absolute',
      bottom: '100%',
      right: spacing.sm,
      marginBottom: spacing.xs,
      alignItems: 'flex-end',
    },
    toggle: {
      width: TOGGLE_SIZE,
      height: TOGGLE_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: TOGGLE_SIZE / 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toggleEmoji: {
      fontSize: fontSize.subtitle + 6,
    },
    // S'ouvre vers le haut, collee au bord droit de l'ecran (la marge du bouton est reprise).
    column: {
      position: 'absolute',
      bottom: '100%',
      marginBottom: spacing.xs,
      right: -spacing.sm,
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 24,
      borderWidth: 1,
      borderRightWidth: 0,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    button: {
      minWidth: MIN_TOUCH_SIZE,
      minHeight: MIN_TOUCH_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: MIN_TOUCH_SIZE / 2,
    },
    emoji: {
      fontSize: fontSize.subtitle + 8,
    },
  });
