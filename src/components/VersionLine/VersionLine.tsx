import { Linking, Text } from 'react-native';

import { versionParts } from '@/helpers/version';
import { useThemedStyles } from '@/themes';

import { wikiLabel } from './helpers';
import type { VersionLineProps } from './types';

import { createStyles } from './styles';

/**
 * The version line — dumb: "v2.65.0 - 🐦 - great-tit" where the animal's name is a link to its English Wikipedia
 * article. The splash screen and the About section draw it with their own text style; the plain text of the same line is
 * `versionLabel`, both built from `versionParts`. A version without a codename is just its number. It is one `Text`, so it
 * wraps instead of being cut on a narrow screen.
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
