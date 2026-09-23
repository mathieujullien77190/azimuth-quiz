import type { Place } from '@/types';

export type PlaceCardProps = {
  place: Place;
  /** Option "Aide pays" : affiche le pays sous le nom du lieu. */
  showCountry: boolean;
  /** Anecdote sur le lieu, repliee par defaut : fournie seulement a la revelation (jamais
   * pendant qu'on devine), absente si le lieu n'en a pas encore. */
  description?: string;
};
