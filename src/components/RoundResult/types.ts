import type { GameSettings, Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  /** Modes de la partie : decide si l'ecart/inclinaison en ligne droite s'affiche. */
  options: Pick<GameSettings, 'straightLine'>;
};
