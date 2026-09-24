import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, spacing } from '@/constants';
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
  });

const Chip = ({ label, emoji, selected, onPress, color }: ChipProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, selected && color !== undefined && { backgroundColor: color, borderColor: color }]}
    >
      {emoji !== undefined && <Text>{emoji}</Text>}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
};

export default Chip;
