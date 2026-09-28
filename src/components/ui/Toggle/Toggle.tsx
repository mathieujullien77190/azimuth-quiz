import { Switch, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/themes';

import { DAY_THUMB_ON_COLOR } from './constants';
import type { ToggleProps } from './types';

import { createStyles } from './styles';

// `disabled` only dims the row and flags it for accessibility — the Switch stays interactive so
// a caller's `onValueChange` can react to a disabled toggle (e.g. explain why) rather than have
// the touch silently swallowed by React Native's own disabled handling.
export const Toggle = ({ label, description, value, onValueChange, disabled = false }: ToggleProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const thumbOnColor = isDark ? colors.success : DAY_THUMB_ON_COLOR;

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description !== undefined && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onValueChange={onValueChange}
        thumbColor={value ? thumbOnColor : colors.textMuted}
        trackColor={{ false: colors.surfaceHigh, true: colors.accent }}
        value={value}
      />
    </View>
  );
};
