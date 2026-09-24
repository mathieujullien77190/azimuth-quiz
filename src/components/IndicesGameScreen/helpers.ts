import { INDICES_CLUE_ORDER, INDICES_PLACES, isCapitalPlace, isFrenchCityPlace } from '@/constants';
import { pickLeastDrawn, type IndicesDrawHistory } from '@/helpers/indicesHistory';
import { effectiveDifficulty } from '@/helpers/places';
import type { Language } from '@/i18n';
import type { Difficulty, IndicesCategory, IndicesPlace } from '@/types';

/** Clues that reveal in 2 clicks: tier/symbol/day-night on the 1st, exact value on the 2nd. */
const TWO_STAGE_CLUE_IDS = new Set(['distance', 'elevation', 'population', 'currency', 'localTime', 'letter']);

/** Total number of possible clues in a round if all were taken, counted multiple times
 * for the ones that reveal in stages (emoji: 3 clicks; distance/elevation/population/
 * currency/localTime/letter: 2; flag: always 3 — 1 color, then every color regardless of how many
 * the flag actually has, then the actual flag) — used as the base for `maxScoreForRound`. */
export const totalRevealCount = (): number =>
  INDICES_CLUE_ORDER.reduce((total, clueId) => {
    const count = clueId === 'emoji' || clueId === 'flagColors' ? 3 : TWO_STAGE_CLUE_IDS.has(clueId) ? 2 : 1;
    return total + count;
  }, 0);

/** Round's starting score: `totalReveals` rounded up to the nearest ten (e.g. 26 possible
 * clues -> 30), a round number rather than depending on the exact current clues. Goes down
 * by 1 for each clue picked (they all have the same "cost" now): finding it fast (few clues
 * used) leaves a higher — and thus more won — remaining score. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

/** Round's place: among places matching both the chosen difficulty and the chosen categories
 * (falls back to the whole pool if the filter is empty), prefers whichever have been drawn the
 * fewest times per `history` — never-drawn places first, then, once everything in the pool has
 * come up at least once, cycles through the least-drawn ones instead of repeating at random. See
 * `pickLeastDrawn`/`recordIndicesDraw` in helpers/indicesHistory.ts. Each place falls into
 * exactly one of the 3 Indices categories — capital first, then French city, then plain city
 * (see `isCapitalPlace`/`isFrenchCityPlace`, cross-referenced from Boussole). */
const indicesCategoryOf = (place: Pick<IndicesPlace, 'name' | 'code'>): IndicesCategory =>
  isCapitalPlace(place) ? 'capital' : isFrenchCityPlace(place) ? 'citiesFr' : 'cities';

export const randomIndicesPlace = (
  difficulty: Difficulty,
  categories: IndicesCategory[],
  language: Language,
  history: IndicesDrawHistory = {},
): IndicesPlace => {
  const pool = INDICES_PLACES.filter(
    (place) => categories.includes(indicesCategoryOf(place)) && effectiveDifficulty(place, language) === difficulty,
  );
  const source = pool.length > 0 ? pool : INDICES_PLACES;
  return pickLeastDrawn(source, history);
};

/** Normalizes a place name for comparison ("I type the city" mode): lowercased, accents,
 * spaces and punctuation (apostrophes, hyphens...) all dropped outright — not just collapsed —
 * so "N'Djamena", "N Djamena" and "Ndjamena" all compare equal regardless of which separator
 * (or none) the player used. */
export const normalizePlaceGuess = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
