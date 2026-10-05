export type NoOneFoundTextProps = {
  /** Current round's players, in any order — only the count and, in solo, the one name matter. */
  players: string[];
  /** Bigger text, the size of Silhouette's "found it" banner (`FOUND_BANNER_FONT_SIZE`). */
  large?: boolean;
};
