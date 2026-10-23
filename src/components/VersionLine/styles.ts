import { StyleSheet } from 'react-native';

import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    // Le nom de l'animal est un lien : couleur d'accent (la foncee en theme clair, la vive etant trop pale sur le
    // sable) et souligne, dans la ligne de l'appelant.
    link: {
      color: isDark ? colors.accent : colors.accentDark,
      textDecorationLine: 'underline',
    },
  });
