import { Text } from 'react-native';

import { formatNumber } from '@/helpers';
import { useThemedStyles } from '@/themes';

import Card from '@/components/ui/Card';
import type { RankCardProps } from './types';

import { createStyles } from './styles';

/** Compass' solo verdict: the rank earned ("Navigateur") with its emoji, and the total score. */
export const RankCard = ({ emoji, title, score }: RankCardProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.score}>{formatNumber(score)}</Text>
    </Card>
  );
};
