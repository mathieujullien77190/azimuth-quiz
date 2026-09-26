import type { Player } from '@/types';

export type PlayerTabsProps = {
  players: Player[];
  /** Tab display order (indexes into `players`): drawn at random each round. */
  order: number[];
  activeIndex: number;
  /** Already-submitted answer, by player index. */
  answered: boolean[];
  /** If false, an already-submitted tab doesn't reopen on a second visit. Only meaningful when
   * `onSelect` is provided. */
  allowRevision?: boolean;
  /** Omitted: the tabs become purely informational (status only, nothing to tap) — see Boussole's
   * own GameScreen, which dropped tap-to-switch entirely. */
  onSelect?: (index: number) => void;
  /** Provided: the active tab shows this text (e.g. "Matou's turn") instead of the initials.
   * Other tabs always stay compact (initials) regardless. */
  activeLabel?: (name: string) => string;
};
