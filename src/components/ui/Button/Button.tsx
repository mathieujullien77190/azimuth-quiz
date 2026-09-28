import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '@/themes';

import type { ButtonProps } from './types';

import { createStyles } from './styles';

export const Button = ({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelGhost]}>{label}</Text>
    </Pressable>
  );
};
