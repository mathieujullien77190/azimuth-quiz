import { Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { APP_TITLE } from './constants';
import type { AppTitleProps } from './types';

import { createStyles } from './styles';

/**
 * Bloc titre de l'app (dumb), partage par l'accueil et le splash : le titre ne doit pas bouger d'un pixel
 * quand le splash laisse place a l'accueil.
 */
export const AppTitle = ({ tagline, children }: AppTitleProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.header}>
      {children}
      <Text style={styles.title}>{APP_TITLE}</Text>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
};
