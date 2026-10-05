import { StyleSheet } from 'react-native';

import type { Theme } from '@/types';

export const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    // The animal's name is a link: the accent colour (the dark one on the light theme, where the bright one is too pale
    // on sand) and underlined, inside the caller's own line.
    link: {
      color: isDark ? colors.accent : colors.accentDark,
      textDecorationLine: 'underline',
    },
  });
