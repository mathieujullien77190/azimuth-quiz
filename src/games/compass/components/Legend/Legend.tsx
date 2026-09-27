import { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useThemedStyles } from '@/themes';
import type { LegendProps } from './types';

import { createStyles } from './styles';

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
