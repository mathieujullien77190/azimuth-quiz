import type { Language } from '@/i18n';
import type { Coordinates, Difficulty, Origin, Place } from '@/types';

/** Ce dont depend le depart : point de depart de la room, lieux tires, manche jouee. */
type RoundOrigin = { origin: Origin | null; places: Place[]; roundIndex: number };

/**
 * Depart d'une manche : celui de la room, ou en mode voyage (des la 2e) le lieu de la manche precedente. Lu
 * en un seul endroit pour que score, cap/distance vrais, globe et reveal concordent. Null tant que la room
 * n'a pas livre son origine ; `travel` `undefined` (room ancienne) = off.
 */
export const originForRound = ({ origin, places, roundIndex }: RoundOrigin, travel: boolean | undefined): Coordinates | null => {
  if (origin === null) return null;
  const previous = places[roundIndex - 1];
  return travel === true && previous !== undefined ? previous.coordinates : origin.coordinates;
};

/** Lieu d'ou part une manche en mode voyage, pour le nommer ; undefined au 1er tour ou sans voyage. */
export const travelFromPlace = (
  { places, roundIndex }: Pick<RoundOrigin, 'places' | 'roundIndex'>,
  travel: boolean | undefined,
): Place | undefined => (travel === true ? places[roundIndex - 1] : undefined);

/**
 * Tirage sans lieu identique a la suite (en mode voyage, distance zero) : un doublon, rare (apres un tour
 * de groupe), est echange avec le prochain lieu different.
 */
export const separateRepeats = (places: Place[]): Place[] => {
  const result = [...places];
  for (let index = 1; index < result.length; index += 1) {
    if (result[index].name !== result[index - 1].name) continue;
    const other = result.findIndex((place, at) => at > index && place.name !== result[index - 1].name);
    if (other !== -1) [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};

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
