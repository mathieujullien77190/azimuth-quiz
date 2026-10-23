import type { ClueId, CluePlace, Coordinates } from '@/types';

export type ClueGridProps = {
  place: CluePlace;
  bearingDeg: number;
  distanceKm: number;
  /** Le point de depart (indice globe). */
  origin?: Coordinates;
  revealedClueIds: ClueId[];
  /** Tout devoiler, quel que soit `revealedClueIds` (affichage de fin de manche). */
  roundOver: boolean;
  /** Undefined desactive toutes les cartes (manche finie, ou pas le tour de cet appareil) ; ce composant ne decide pas lequel. */
  onPickClue?: (clueId: ClueId) => void;
};
