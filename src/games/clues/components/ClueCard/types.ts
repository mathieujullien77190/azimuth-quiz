import type { ClueId, CluePlace, Coordinates } from '@/types';

export type ClueState = 'locked' | 'revealed';

export type ClueCardProps = {
  clueId: ClueId;
  label: string;
  place: CluePlace;
  state: ClueState;
  /** Verrouille + fourni : la carte devient cliquable pour choisir cet indice. */
  onPress?: () => void;
  /** Permet de recliquer une carte devoilee (`emoji`/`flagColors`) tant qu'il reste a devoiler ; chaque clic compte comme un indice. */
  moreToReveal?: boolean;
  /** Indices `bearing`/`distance` seulement : cap et distance depuis le joueur. */
  bearingDeg?: number;
  distanceKm?: number;
  /** Indice 'globe' seulement : le point de depart. */
  origin?: Coordinates;
  /** Indice 'globe' seulement : 1 = lieu et depart avec equateur et Greenwich, 2 = plus les terres. */
  globeStage?: number;
  /** Indice `emoji` seulement : nombre d'emoji deja devoiles (0-3). */
  emojiStage?: number;
  /** Indice `flagColors` seulement : nombre de couleurs deja devoilees (1 a `place.flagColors.length`). */
  flagStage?: number;
  /** Indice `distance` seulement : 1 = cap+distance sur le globe, km masques ("?"), 2 = km devoiles. */
  distanceStage?: number;
  /** Indice `elevation` seulement : 1 = emoji de palier, 2 = altitude exacte. */
  elevationStage?: number;
  /** Indice `population` seulement : 1 = jauge de 5 points, 2 = population exacte. */
  populationStage?: number;
  /** Indice `currency` seulement : 1 = symbole, 2 = nom complet. */
  currencyStage?: number;
  /** Indice `localTime` seulement : 1 = emoji jour/nuit, 2 = heure exacte. */
  localTimeStage?: number;
  /** Indice `letter` seulement : 1 = premiere lettre seule, 2 = une case par lettre, longueur reelle par mot. */
  letterStage?: number;
};
