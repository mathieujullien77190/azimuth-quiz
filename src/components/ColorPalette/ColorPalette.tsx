import { Text, View } from 'react-native';

import { useLanguage } from '@/i18n';
import { THEMES, useTheme, useThemedStyles } from '@/themes';

import { COLOR_TOKENS, COPY, THEME_LABELS } from './constants';
import type { ColorPaletteProps } from './types';

import { createStyles } from './styles';

/**
 * Every color of the app's themes side by side — one column per theme, a swatch and its hex value for
 * each token, with what it is used for. The theme the app (or Storybook's toolbar) is showing right
 * now is the highlighted column. Dumb: reads only the themes it is given.
 */
export const ColorPalette = ({ themes = Object.values(THEMES) }: ColorPaletteProps) => {
  const styles = useThemedStyles(createStyles);
  const { language } = useLanguage();
  const current = useTheme();
  const copy = COPY[language];

  return (
    <View style={styles.table}>
      <Text style={styles.title}>{copy.title}</Text>

      <View style={styles.row}>
        <View style={styles.nameColumn}>
          <Text style={styles.headerText}>{copy.token}</Text>
        </View>
        {themes.map((theme) => (
          <View key={theme.id} style={styles.themeColumn}>
            <Text style={[styles.headerText, theme.id === current.id && styles.headerCurrent]}>
              {THEME_LABELS[theme.id][language]}
              {theme.id === current.id && ` · ${copy.current}`}
            </Text>
          </View>
        ))}
      </View>

      {COLOR_TOKENS.map((token) => (
        <View key={token.name} style={styles.row}>
          <View style={styles.nameColumn}>
            <Text style={styles.tokenName}>{token.name}</Text>
            <Text style={styles.description}>{token.description[language]}</Text>
          </View>
          {themes.map((theme) => (
            <View key={theme.id} style={styles.themeColumn}>
              <View style={[styles.swatch, { backgroundColor: token.get(theme) }]} />
              <Text style={styles.hex}>{token.get(theme)}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
