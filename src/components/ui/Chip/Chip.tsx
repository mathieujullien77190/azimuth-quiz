import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/data';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { ChipProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm + 1,
      borderRadius: radius.button,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
    },
    selected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    label: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body - 1,
    },
    labelSelected: {
      color: colors.onAccent,
    },
    disabled: {
      opacity: 0.5,
    },
  });

// `disabled` is a visual/accessibility cue only — the Pressable itself stays tappable so a
// caller's `onPress` can react to a disabled press (e.g. explain why) rather than have the touch
// silently swallowed by React Native's own disabled handling.
const Chip = ({ label, emoji, selected, onPress, disabled = false }: ChipProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
    >
      {emoji !== undefined && <Text>{emoji}</Text>}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
};

export default Chip;
