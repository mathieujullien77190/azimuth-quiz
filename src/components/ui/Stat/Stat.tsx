import { Text, View } from 'react-native';
import { useThemedStyles } from '@/themes';

import type { StatProps } from './types';

import { createStyles } from './styles';

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
