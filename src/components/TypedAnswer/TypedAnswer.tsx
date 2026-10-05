import { Text, View } from 'react-native';

import { HYPHEN_SLOT } from '@/games/clues/helpers/clueSkeleton';
import { useThemedStyles } from '@/themes';

import type { TypedAnswerProps } from './types';

import { createStyles } from './styles';

/**
 * An answer drawn as boxed letters, the way Clues shows it while it is typed (and Silhouette's country name now does
 * too) — dumb: it only draws the groups it is given.
 */
export const TypedAnswer = ({ groups }: TypedAnswerProps) => {
  const styles = useThemedStyles(createStyles);

  if (groups.length === 0) return null;
  return (
    <View style={styles.row}>
      {groups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.word}>
          {group.map((letter, letterIndex) => (
            <View key={letterIndex} style={letter === HYPHEN_SLOT ? styles.hyphen : styles.slot}>
              {letter !== null && <Text style={styles.letter}>{letter}</Text>}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
