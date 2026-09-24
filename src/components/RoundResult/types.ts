import type { GameSettings, Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  /** Each player's cumulative score, previous rounds + this one (same order as `players`). */
  totals: number[];
  /** Game modes: decides whether the straight-line gap/inclination is shown. */
  options: Pick<GameSettings, 'straightLine'>;
};
