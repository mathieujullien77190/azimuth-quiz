import { StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { StatProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    stat: {
      flex: 1,
      backgroundColor: colors.surfaceHigh,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    value: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
      marginTop: 2,
    },
  });

const Stat = ({ label, value, color }: StatProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color !== undefined && { color }]}>{value}</Text>
    </View>
  );
};

export default Stat;
