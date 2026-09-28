import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '@/themes';

import type { ChipProps } from './types';

import { createStyles } from './styles';

// `disabled` is a visual/accessibility cue only — the Pressable itself stays tappable so a
// caller's `onPress` can react to a disabled press (e.g. explain why) rather than have the touch
// silently swallowed by React Native's own disabled handling.
export const Chip = ({ label, emoji, selected, onPress, disabled = false }: ChipProps) => {
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
