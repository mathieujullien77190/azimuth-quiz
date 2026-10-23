import type { Player, RoundRecord } from '@/types';

export type RoundResultProps = {
  record: RoundRecord;
  players: Player[];
  /** Score cumule de chaque joueur, manche comprise (ordre de `players`). */
  totals: number[];
  /**
   * En ligne, en attente du score : un indicateur par joueur. Masque la verite et montre la reponse brute
   * ou "?", sans tri.
   */
  answered?: boolean[];
  /** En ligne, en attente : index de cet appareil, affiche en premier et sans bouton `onKick`. */
  localIndex?: number;
  /** En ligne, hote seul : bouton d'expulsion sous le score des AUTRES joueurs (index de `players`). */
  onKick?: (index: number) => void;
};
