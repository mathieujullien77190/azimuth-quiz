import { Text, View } from 'react-native';
import { useThemedStyles } from '@/themes';

import Card from '../Card';
import type { SectionProps } from './types';

import { createStyles } from './styles';

/** Titled card: groups the fields of a single subject. */
const Section = ({ title, hint, children }: SectionProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {children}
    </Card>
  );
};

export default Section;
