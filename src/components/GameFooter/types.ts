import type { ReactNode } from 'react';

export type GameFooterProps = {
  /** Whatever the game puts in its footer: the answer bar, the "next round" button, a waiting text... */
  children: ReactNode;
  /** Floats the round reactions button above the footer (its column of emojis calling this); leave it out where nobody
   * is there to see them (alone in the room). Takes no room in the footer. */
  onReact?: (emoji: string) => void;
};
