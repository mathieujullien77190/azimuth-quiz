import { PLACES } from '@/data';
import { MIN_PLACE_DISTANCE_KM } from '@/games/compass/constants';
import type { Language } from '@/i18n';
import type { Category, Coordinates, Difficulty, GameSettings, Place } from '@/types';

import { distanceKm } from '@/helpers/geo';
import { shuffle } from '@/helpers/random';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** A French place is "home turf" for a French-speaking player — a name/landmark that's obvious
 * in French usually isn't to anyone else — so it's bumped one difficulty tier when the app is in
 * English (capped at 'hard'). Left untouched in French, and for every other country. */
export const effectiveDifficulty = (place: Pick<Place, 'code' | 'difficulty'>, language: Language): Difficulty => {
  if (language !== 'en' || place.code !== 'FR') return place.difficulty;
  const index = DIFFICULTY_ORDER.indexOf(place.difficulty);
  return DIFFICULTY_ORDER[Math.min(index + 1, DIFFICULTY_ORDER.length - 1)];
};

/** Places for a game: matching categories, matching difficulty. */
export const filterPlaces = (categories: Category[], difficulty: Difficulty, language: Language): Place[] =>
  PLACES.filter((place) => categories.includes(place.category) && effectiveDifficulty(place, language) === difficulty);

/**
 * Draws the game's places, avoiding ones too close to the starting point
 * (unless none are left: better a nearby place than no game at all).
 */
export const pickPlaces = (origin: Coordinates, settings: GameSettings, language: Language): Place[] => {
  const candidates = filterPlaces(settings.categories, settings.difficulty, language);
  const far = candidates.filter((place) => distanceKm(origin, place.coordinates) >= MIN_PLACE_DISTANCE_KM);
  return shuffle(far.length > 0 ? far : candidates).slice(0, settings.rounds);
};
