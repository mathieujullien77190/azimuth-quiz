import { Text, View } from 'react-native';
import { useThemedStyles } from '@/themes';

import Button from '../ui/Button';
import Card from '../ui/Card';
import type { GameCardProps } from './types';

import { createStyles } from './styles';

export const GameCard = ({ icon, title, tagline, meta, note, ctaLabel, onPress, disabled = false }: GameCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={[styles.card, disabled && styles.disabled]}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.tagline}>{tagline}</Text>
      <Text style={styles.meta}>{meta.join('   ·   ')}</Text>
      {note !== undefined && <Text style={styles.note}>{note}</Text>}
      <Button disabled={disabled} label={ctaLabel} onPress={onPress} variant={disabled ? 'ghost' : 'primary'} />
    </Card>
  );
};
