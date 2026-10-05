import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

export const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    mascotButton: {
      position: 'absolute',
      zIndex: 10,
      elevation: 10,
      top: spacing.sm,
      right: spacing.lg,
    },
    // The two big cards, stacked and pushed to the BOTTOM of the screen (the title block stays at the top, where the splash
    // draws it too): the free height is between them. The Screen's bottom safe area and padding apply as for any screen.
    games: {
      flexGrow: 1,
      justifyContent: 'flex-end',
      gap: spacing.lg,
    },
  });
