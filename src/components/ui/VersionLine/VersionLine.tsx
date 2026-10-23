import { Linking, Text } from 'react-native';

import { versionParts } from '@/helpers/appInfo';
import { useThemedStyles } from '@/themes';

import { wikiLabel } from './helpers';
import type { VersionLineProps } from './types';

import { createStyles } from './styles';

/**
 * Ligne de version : « v2.65.0 - 🐦 - great-tit », le nom de l'animal etant un lien vers son article Wikipedia
 * anglais. Le splash et A propos la dessinent avec leur style ; le texte brut est `versionLabel` (tous deux
 * issus de `versionParts`). Sans codename : juste le numero. Un seul `Text` : elle passe a la ligne au lieu d'etre coupee.
 */
export const VersionLine = ({ version, codename, style }: VersionLineProps) => {
  const styles = useThemedStyles(createStyles);
  const { prefix, name, wiki } = versionParts(version, codename);

  return (
    <Text style={style}>
      {prefix}
      {name !== null && wiki !== null && (
        <Text
          accessibilityLabel={wikiLabel(name)}
          accessibilityRole="link"
          onPress={() => Linking.openURL(wiki)}
          style={styles.link}
        >
          {name}
        </Text>
      )}
    </Text>
  );
};
