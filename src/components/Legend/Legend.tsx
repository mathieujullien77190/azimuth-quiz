import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { DOT_SIZE } from './constants';
import type { LegendProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm + 4,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      borderWidth: 2,
    },
    check: {
      color: colors.onAccent,
      fontSize: 8,
      fontWeight: '700',
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.caption + 1,
    },
  });

/** Who is which color, on the compass and on the Earth. `status` (online play's waiting roster
 * only) replaces the plain dot with a spinner or a checkmark on it — every other caller leaves
 * it out and gets the plain dot exactly as before. */
export const Legend = memo(function Legend({ items }: LegendProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          {item.status === 'pending' ? (
            <ActivityIndicator color={item.color} size="small" />
          ) : (
            <View
              style={[
                styles.dot,
                { backgroundColor: item.color },
                item.ring && [styles.ring, { borderColor: item.color }],
              ]}
            >
              {item.status === 'answered' && <Text style={styles.check}>✓</Text>}
            </View>
          )}
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
});
