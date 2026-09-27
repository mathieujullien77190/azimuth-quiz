import type { Place } from '@/types';

export type PlaceCardProps = {
  place: Place;
  /** "Country hint" option: shows the country under the place's name. */
  showCountry: boolean;
  /** Trivia about the place, collapsed by default: only provided on reveal (never
   * while guessing), absent if the place doesn't have one yet. */
  description?: string;
};
