import type { Language } from '@/i18n';
import type { Difficulty, Place } from '@/types';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/** A French place is "home turf" for a French-speaking player — a name/landmark that's obvious
 * in French usually isn't to anyone else — so it's bumped one difficulty tier when the app is in
 * English (capped at 'hard'). Left untouched in French, and for every other country. */
export const effectiveDifficulty = (place: Pick<Place, 'code' | 'difficulty'>, language: Language): Difficulty => {
  if (language !== 'en' || place.code !== 'FR') return place.difficulty;
  const index = DIFFICULTY_ORDER.indexOf(place.difficulty);
  return DIFFICULTY_ORDER[Math.min(index + 1, DIFFICULTY_ORDER.length - 1)];
};
