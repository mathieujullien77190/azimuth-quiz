import type { ReactNode, Ref } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

export type ScreenProps = {
  children: ReactNode;
  /** Stays fixed at the top, above the scrolling area (e.g. player selector). */
  header?: ReactNode;
  /** Stays fixed at the bottom, below the scrolling area — rendered as given, so wrap it in a
   * `GameFooter` for the panel look. */
  footer?: ReactNode;
  /** Drawn over the whole screen, header and footer included, never catching a touch itself (e.g. the emoji reactions). */
  overlay?: ReactNode;
  /** Optional: gives access to the internal ScrollView (e.g. programmatic scrollTo). */
  scrollRef?: Ref<ScrollView>;
  /** Optional: forwarded straight to the internal ScrollView (e.g. tracking scroll position to
   * sync a footer button's label — see GameScreen/OnlineGameScreen's FooterNav). */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};
