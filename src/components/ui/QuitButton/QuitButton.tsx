import { Pressable, Text } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { QuitButtonProps } from './types';

import { createStyles } from './styles';

/** "Quit the game": a cross in a circle, in the normal text color, top-left of every game header. Icon only —
 * the label ("Quitter") lives in the accessibility label. */
export const QuitButton = ({ onPress }: QuitButtonProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Pressable
      accessibilityLabel={t.game.quit}
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={styles.circle}
    >
      <Text style={styles.cross}>✕</Text>
    </Pressable>
  );
};
