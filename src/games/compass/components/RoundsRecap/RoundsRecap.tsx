import { Text, View } from 'react-native';

import { useThemedStyles } from '@/themes';

import Card from '@/components/ui/Card';
import type { RoundsRecapProps } from './types';

import { createStyles } from './styles';

/**
 * Compass' round-by-round recap: one row per round, and for each criterion (the heading, the distance)
 * who was best that round and with how many points — dumb, the caller works the winners out.
 */
export const RoundsRecap = ({ title, columns, rows }: RoundsRecapProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        <View style={styles.label} />
        {columns.map((column) => (
          <Text key={column} style={[styles.cell, styles.header]}>
            {column}
          </Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={row.label + index} style={[styles.row, styles.rowBorder]}>
          <Text numberOfLines={2} style={[styles.name, styles.label]}>
            {row.label}
          </Text>
          {row.cells.map((cell, cellIndex) => (
            <View key={cellIndex} style={styles.cell}>
              <View style={styles.cellLine}>
                {cell.color !== undefined && <View style={[styles.dot, { backgroundColor: cell.color }]} />}
                <Text style={styles.cellText}>{cell.text}</Text>
              </View>
              {cell.detail !== undefined && <Text style={styles.cellDetail}>{cell.detail}</Text>}
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
};
