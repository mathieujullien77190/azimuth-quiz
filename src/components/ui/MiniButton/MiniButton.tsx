import { Pressable, Text } from 'react-native';

import { useThemedStyles } from '@/themes';

import type { MiniButtonProps } from './types';

import { createStyles } from './styles';

/**
 * The small pill button ("Expulser", "Comment les points sont calculés"...): outlined, in the
 * accent color or, for a destructive action, the danger red (`variant="danger"`).
 */
export const MiniButton = ({ label, onPress, variant = 'accent', style }: MiniButtonProps) => {
  const styles = useThemedStyles(createStyles);
  const danger = variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={[styles.button, danger ? styles.danger : styles.accent, style]}
    >
      <Text style={[styles.label, danger ? styles.labelDanger : styles.labelAccent]}>{label}</Text>
    </Pressable>
  );
};
