import type { StandingEntry } from '@/components/game/FinalStandings/types';
import type { RecapRow } from '@/components/game/RoundsRecap';
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

export type EndScreenViewProps = {
  title: string;
  entries: StandingEntry[];
  localName: string;
  /** Score maximum possible de la partie. */
  maxScore: number;
  recapTitle: string;
  /** Intitule des colonnes du recap (direction, distance). */
  columns: string[];
  rows: RecapRow[];
  onReplay: () => void;
  onQuit: () => void;
};
