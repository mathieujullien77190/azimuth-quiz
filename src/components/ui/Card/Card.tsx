import { View } from 'react-native';
import { useThemedStyles } from '@/themes';

import type { CardProps } from './types';

import { createStyles } from './styles';

const Card = ({ children, style }: CardProps) => {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
};

export default Card;
