import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import type { CardProps } from './types';

const createStyles = ({ colors, radius, card }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: card.borderWidth,
      borderColor: colors.border,
      padding: spacing.md,
      ...(card.shadowColor !== null && {
        shadowColor: card.shadowColor,
        shadowOpacity: card.shadowOpacity,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }),
    },
  });

const Card = ({ children, style }: CardProps) => {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
};

export default Card;
