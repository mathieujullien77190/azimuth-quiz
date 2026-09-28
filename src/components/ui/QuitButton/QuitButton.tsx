import { Pressable, Text } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { QuitButtonProps } from './types';

import { createStyles } from './styles';

/** "Quit": a cross, icon only — the label ("Quitter") lives in the accessibility label. `base` is the
 * circled cross of every game header, `accent` the plain accent-colored one of the setup screens. */
export const QuitButton = ({ onPress, variant = 'base' }: QuitButtonProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const accent = variant === 'accent';

  return (
    <Pressable
      accessibilityLabel={t.game.quit}
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={accent ? styles.accent : styles.base}
    >
      <Text style={accent ? styles.crossAccent : styles.cross}>✕</Text>
    </Pressable>
  );
};
