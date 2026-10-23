import type { Language } from '@/i18n';
import type { Difficulty, Place } from '@/types';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

/**
 * Un lieu francais est "chez soi" pour un francophone : releve d'un cran de difficulte en anglais (plafond
 * 'hard'). Inchange en francais et pour les autres pays.
 */
export const effectiveDifficulty = (place: Pick<Place, 'code' | 'difficulty'>, language: Language): Difficulty => {
  if (language !== 'en' || place.code !== 'FR') return place.difficulty;
  const index = DIFFICULTY_ORDER.indexOf(place.difficulty);
  return DIFFICULTY_ORDER[Math.min(index + 1, DIFFICULTY_ORDER.length - 1)];
};
