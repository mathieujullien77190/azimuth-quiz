import { StyleSheet, Text, View } from 'react-native';

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
    },
    ring: {
      borderWidth: 2,
    },
    label: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.caption + 1,
    },
  });

/** Qui est quelle couleur, sur la boussole et sur la Terre. */
export const Legend = ({ items }: LegendProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View
            style={[
              styles.dot,
              { backgroundColor: item.color },
              item.ring && [styles.ring, { borderColor: item.color }],
            ]}
          />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};
