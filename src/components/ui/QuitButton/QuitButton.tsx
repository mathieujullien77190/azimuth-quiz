import { Pressable, Text } from 'react-native';

import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import type { QuitButtonProps } from './types';

import { createStyles } from './styles';

/**
 * « Quitter » : une croix, icone seule ; le libelle est dans le libelle d'accessibilite. `base` = croix cerclee
 * des headers de jeu, `accent` = croix simple couleur d'accent des ecrans de setup.
 */
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
