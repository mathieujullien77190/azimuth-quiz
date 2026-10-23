import { Pressable, Text } from 'react-native';
import { useThemedStyles } from '@/themes';

import type { ChipProps } from './types';

import { createStyles } from './styles';

// `disabled` n'est qu'un signal visuel/accessibilite : le Pressable reste cliquable pour que `onPress` de
// l'appelant puisse reagir (ex. expliquer pourquoi) plutot que le toucher soit avale.
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
