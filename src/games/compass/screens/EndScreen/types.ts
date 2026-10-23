import type { Player, RoundRecord } from '@/types';

export type EndScreenProps = {
  players: Player[];
  records: RoundRecord[];
  /** Total de chaque joueur, dans l'ordre des joueurs. */
  totals: number[];
  /** Nom du joueur de cet appareil, voir `localName` de `FinalStandings`. */
  localName: string;
  onReplay: () => void;
  onQuit: () => void;
};
