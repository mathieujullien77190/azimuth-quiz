import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};
