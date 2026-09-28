import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/themes';

import type { SpinnerProps } from './types';

/** The little spinning indicator ("we're waiting"): shared by the loading splash and by the round
 * result while it waits for a player's answer. */
export const Spinner = ({ size = 'small', color }: SpinnerProps) => {
  const { colors } = useTheme();

  return <ActivityIndicator color={color ?? colors.accent} size={size} />;
};
