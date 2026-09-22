import type { IndicesClueId, IndicesPlace } from '@/types';

export type IndicesClueState = 'locked' | 'revealed';

export type IndicesClueCardProps = {
  clueId: IndicesClueId;
  label: string;
  place: IndicesPlace;
  state: IndicesClueState;
  /** Cout en points de cet indice : toujours visible, meme verrouille (choix informe). */
  cost: number;
  /** Verrouille + fournie : la carte devient pressable pour choisir cet indice. */
  onPress?: () => void;
  /** Autorise a re-cliquer une carte deja revelee (uniquement l'indice `emoji`, tant qu'il reste
   * des emoji a devoiler : chaque clic compte comme un nouvel indice choisi, cout inclus). */
  moreToReveal?: boolean;
  /** Uniquement pour les indices `bearing`/`distance` : cap et distance depuis le joueur. */
  bearingDeg?: number;
  distanceKm?: number;
  /** Uniquement pour l'indice `emoji` : combien des 3 emoji sont deja devoiles (0-3). */
  emojiStage?: number;
};
