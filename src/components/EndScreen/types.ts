import type { Player, RoundRecord } from '@/types';

export type EndScreenProps = {
  players: Player[];
  records: RoundRecord[];
  /** Each player's total, in player order. */
  totals: number[];
  onReplay: () => void;
  onMenu: () => void;
};

export type RankedPlayer = {
  player: Player;
  total: number;
  /** 1 = first; tied players share the same rank. */
  rank: number;
};
