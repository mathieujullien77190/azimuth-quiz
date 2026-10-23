import { Pressable, Text } from 'react-native';

import { useThemedStyles } from '@/themes';

import type { MiniButtonProps } from './types';

import { createStyles } from './styles';

/**
 * Petit bouton en pilule (« Expulser », « Comment les points sont calcules »...) : contour de la couleur
 * d'accent ou, pour une action destructive, rouge danger (`variant="danger"`).
 */
export const MiniButton = ({ label, onPress, variant = 'accent', accessibilityLabel, style }: MiniButtonProps) => {
  const styles = useThemedStyles(createStyles);
  const danger = variant === 'danger';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[styles.button, danger ? styles.danger : styles.accent, style]}
    >
      <Text style={[styles.label, danger ? styles.labelDanger : styles.labelAccent]}>{label}</Text>
    </Pressable>
  );
};
