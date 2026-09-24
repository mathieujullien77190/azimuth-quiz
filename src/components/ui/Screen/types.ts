import type { ReactNode, Ref } from 'react';
import type { ScrollView } from 'react-native';

export type ScreenProps = {
  children: ReactNode;
  /** Stays fixed at the top, above the scrolling area (e.g. player selector). */
  header?: ReactNode;
  /** Stays fixed at the bottom, below the scrolling area (e.g. main action button). */
  footer?: ReactNode;
  /** Optional: gives access to the internal ScrollView (e.g. programmatic scrollTo). */
  scrollRef?: Ref<ScrollView>;
};
