import { Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import { APP_TITLE } from './constants';
import type { AppTitleProps } from './types';

import { createStyles } from './styles';

/**
 * The app's title block — dumb: "AZIMUTH QUIZ" and its tagline under it. The home screen and the startup splash both draw
 * it, from this one component, so that when the splash fades into the home the title and the tagline do not move by a
 * pixel: only what is below them changes. Both put it first inside a `Screen`-like safe area (same padding), so the
 * position is the same on every screen size.
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
