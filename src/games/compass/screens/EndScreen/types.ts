import type { Player, RoundRecord } from '@/types';

export type EndScreenProps = {
  players: Player[];
  records: RoundRecord[];
  /** Each player's total, in player order. */
  totals: number[];
  onMenu: () => void;
};
