import { View } from 'react-native';

import { useThemedStyles } from '@/themes';

import type { GameFooterProps } from './types';

import { createStyles } from './styles';

/**
 * The in-round footer shared by every game — dumb: just the panel (background, top border, padding)
 * around its `children`, the counterpart of `GameHeader` at the bottom of the screen. Where it sits
 * is the caller's: the `footer` of a `Screen`, or floating over the board in Silhouette.
 */
export const GameFooter = ({ children }: GameFooterProps) => {
  const styles = useThemedStyles(createStyles);

  return <View style={styles.footer}>{children}</View>;
};
