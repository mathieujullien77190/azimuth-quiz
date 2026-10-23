import type { Place } from '@/types';

export type PlaceCardProps = {
  place: Place;
  /** Option "indice de pays" : affiche le pays sous le nom. */
  showCountry: boolean;
  /** Anecdote repliee par defaut : fournie seulement au reveal, absente si le lieu n'en a pas. */
  description?: string;
};
