import type { GameSettings, Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  /** Each player's cumulative score, previous rounds + this one (same order as `players`). */
  totals: number[];
  /** Game modes: decides whether the straight-line gap/inclination is shown. */
  options: Pick<GameSettings, 'straightLine'>;
  /** Online play only, while waiting for the round to be scored: one flag per player (same order
   * as `players`/`record.results`). Blanks the truth row and swaps every player's per-category
   * value/points for a raw guess (if that player has answered) or "?" (points always, since no
   * player's score is official yet) — no sorting by score either, since there isn't one yet. */
  answered?: boolean[];
  /** Online play only, while pending: this device's own index into `players`/`record.results` —
   * pinned first (there's no ranking yet to sort by), and never shown its own `onKick` button. */
  localIndex?: number;
  /** Online play, host only: shows a full-word expel button below each OTHER player's score
   * (index into `players`/`record.results`, same order) to remove them from the room mid-game. */
  onKick?: (index: number) => void;
};
