import { StyleSheet } from 'react-native';
import { spacing } from '@/data';
import type { Theme } from '@/types';

import { FOUND_BANNER_FONT_SIZE } from '@/components/ui/NoOneFoundText/styles';

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    footer: {
      gap: spacing.sm + 2,
    },
    banner: {
      ...typography.heading,
      color: colors.success,
      fontSize: FOUND_BANNER_FONT_SIZE,
      textAlign: 'center',
    },
  });
