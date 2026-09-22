import type { Place } from '@/types';

export type PlaceCardProps = {
  place: Place;
  originName: string;
  /** Option "Aide pays" : affiche le pays sous le nom du lieu. */
  showCountry: boolean;
};
