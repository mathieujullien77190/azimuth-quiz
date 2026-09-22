import type { GameSettings, Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  /** Score cumule de chaque joueur, manches precedentes + celle-ci (meme ordre que `players`). */
  totals: number[];
  /** Modes de la partie : decide si l'ecart/inclinaison en ligne droite s'affiche. */
  options: Pick<GameSettings, 'straightLine'>;
};
