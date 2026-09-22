import type { Place, Player } from '@/types';

export type PlaceCardProps = {
  place: Place;
  roundNumber: number;
  totalRounds: number;
  originName: string;
  /** Joueur dont c'est le tour (parties a plusieurs). */
  player?: Player;
  /** Option "Aide pays" : affiche le pays sous le nom du lieu. */
  showCountry: boolean;
};
