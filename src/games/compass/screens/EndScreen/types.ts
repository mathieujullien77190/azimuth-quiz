import type { Player, RoundRecord } from '@/types';

export type EndScreenProps = {
  players: Player[];
  records: RoundRecord[];
  /** Each player's total, in player order. */
  totals: number[];
  /** This device's own player name — see `FinalStandings`' own `localName`. */
  localName: string;
  onMenu: () => void;
};
