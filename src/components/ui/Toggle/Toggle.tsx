import { Switch, Text, View } from 'react-native';
import { useTheme, useThemedStyles } from '@/themes';

import { DAY_TRACK_ON_COLOR, NIGHT_THUMB_ON_COLOR } from './constants';
import type { ToggleProps } from './types';

import { createStyles } from './styles';

// `disabled` only dims the row and flags it for accessibility — the Switch stays interactive so
// a caller's `onValueChange` can react to a disabled toggle (e.g. explain why) rather than have
// the touch silently swallowed by React Native's own disabled handling.
export const Toggle = ({ label, description, value, onValueChange, disabled = false }: ToggleProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const thumbOnColor = isDark ? NIGHT_THUMB_ON_COLOR : colors.accent;
  const trackOnColor = isDark ? colors.accent : DAY_TRACK_ON_COLOR;

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
        // react-native-web ignores `thumbColor` while the switch is on and paints `activeThumbColor` (teal by
        // default), a prop the native types don't know about.
        {...{ activeThumbColor: thumbOnColor }}
        trackColor={{ false: colors.surfaceHigh, true: trackOnColor }}
        value={value}
      />
    </View>
  );
};
