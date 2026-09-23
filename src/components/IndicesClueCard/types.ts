import type { IndicesClueId, IndicesPlace } from '@/types';

export type IndicesClueState = 'locked' | 'revealed';

export type IndicesClueCardProps = {
  clueId: IndicesClueId;
  label: string;
  place: IndicesPlace;
  state: IndicesClueState;
  /** Verrouille + fournie : la carte devient pressable pour choisir cet indice. */
  onPress?: () => void;
  /** Autorise a re-cliquer une carte deja revelee (indices `emoji`/`flagColors`, tant qu'il reste
   * de quoi devoiler : chaque clic compte comme un nouvel indice choisi, cout inclus). */
  moreToReveal?: boolean;
  /** Uniquement pour les indices `bearing`/`distance` : cap et distance depuis le joueur. */
  bearingDeg?: number;
  distanceKm?: number;
  /** Uniquement pour l'indice `emoji` : combien des 3 emoji sont deja devoiles (0-3). */
  emojiStage?: number;
  /** Uniquement pour l'indice `flagColors` : combien des couleurs du drapeau sont deja devoilees
   * (1 a `INDICES_FLAG_COLORS_BY_COUNTRY[place.country].length`). */
  flagStage?: number;
  /** Uniquement pour l'indice `distance` : 1 = cap+distance affiches sur le globe mais valeur en
   * km cachee ("?" au milieu, re-cliquable), 2 = km devoiles (meme principe que emoji/flagStage). */
  distanceStage?: number;
  /** Uniquement pour l'indice `elevation` : 1 = emoji de palier (voir `elevationTierEmoji`), 2 =
   * altitude exacte devoilee. */
  elevationStage?: number;
  /** Uniquement pour l'indice `population` : 1 = jauge a 5 ronds (voir `populationTier`), 2 =
   * population exacte devoilee. */
  populationStage?: number;
  /** Uniquement pour l'indice `currency` : 1 = symbole (`place.currency`), 2 = nom complet de la
   * devise (voir INDICES_CURRENCY_NAMES). */
  currencyStage?: number;
  /** Uniquement pour l'indice `localTime` : 1 = emoji jour/nuit (voir `dayNightEmoji`), 2 = heure
   * locale exacte devoilee. */
  localTimeStage?: number;
};
