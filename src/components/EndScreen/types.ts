import type { Player, RoundRecord } from '@/types';

export type EndScreenProps = {
  players: Player[];
  records: RoundRecord[];
  /** Total de chaque joueur, dans l'ordre des joueurs. */
  totals: number[];
  bestScore: number;
  isNewBest: boolean;
  onReplay: () => void;
  onMenu: () => void;
};

export type RankedPlayer = {
  player: Player;
  total: number;
  /** 1 = premier ; les ex aequo partagent le meme rang. */
  rank: number;
};
