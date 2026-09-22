import { StyleSheet, Switch, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

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
  });

const Toggle = ({ label, description, value, onValueChange }: ToggleProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description !== undefined && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        accessibilityLabel={label}
        onValueChange={onValueChange}
        thumbColor={value ? colors.onAccent : colors.textMuted}
        trackColor={{ false: colors.surfaceHigh, true: colors.accent }}
        value={value}
      />
    </View>
  );
};

export default Toggle;
