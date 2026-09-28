import { Text, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import Button from '../ui/Button';
import Card from '../ui/Card';
import type { GameCardProps } from './types';

import { createStyles } from './styles';

export const GameCard = ({ icon, title, tagline, maxPlayers, ctaLabel, onPress }: GameCardProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.tagline}>{tagline}</Text>
      <Text style={styles.players}>{t.home.playersRange(maxPlayers)}</Text>
      <Button label={ctaLabel} onPress={onPress} />
    </Card>
  );
};
