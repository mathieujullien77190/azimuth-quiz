import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { ButtonProps } from './types';

const createStyles = ({ colors, radius, typography, buttonDepth }: Theme) =>
  StyleSheet.create({
    base: {
      minHeight: 56,
      borderRadius: radius.button,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: {
      backgroundColor: colors.accent,
      borderBottomWidth: buttonDepth,
      borderBottomColor: colors.accentDark,
    },
    ghost: {
      backgroundColor: colors.surfaceHigh,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    pressed: {
      transform: [{ scale: 0.97 }],
      opacity: 0.9,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      ...typography.heading,
      fontSize: fontSize.subtitle,
      letterSpacing: 0.3,
    },
    labelPrimary: {
      color: colors.onAccent,
    },
    labelGhost: {
      color: colors.text,
    },
  });

const Button = ({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) => {
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

export default Button;
