import { StyleSheet, Switch, Text, View } from 'react-native';

import { fontSize, spacing } from '@/data';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { DAY_THUMB_ON_COLOR } from './constants';
import type { ToggleProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    description: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    disabled: {
      opacity: 0.5,
    },
  });

// `disabled` only dims the row and flags it for accessibility — the Switch stays interactive so
// a caller's `onValueChange` can react to a disabled toggle (e.g. explain why) rather than have
// the touch silently swallowed by React Native's own disabled handling.
const Toggle = ({ label, description, value, onValueChange, disabled = false }: ToggleProps) => {
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

export default Toggle;
