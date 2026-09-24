import { INDICES_CLUE_ORDER, INDICES_PLACES } from '@/constants';
import type { Difficulty, IndicesPlace } from '@/types';

/** Clues that reveal in 2 clicks: tier/symbol/day-night on the 1st, exact value on the 2nd. */
const TWO_STAGE_CLUE_IDS = new Set(['distance', 'elevation', 'population', 'currency', 'localTime']);

/** Total number of possible clues in a round if all were taken, counted multiple times
 * for the ones that reveal in stages (emoji: 3 clicks; distance/elevation/population/
 * currency/localTime: 2; flag: at most 3 — 1 color, then 1 color, then all the rest on the
 * 3rd click, even if the flag has more) — used as the base for `maxScoreForRound`. */
export const totalRevealCount = (flagColorCount: number): number =>
  INDICES_CLUE_ORDER.reduce((total, clueId) => {
    const count =
      clueId === 'emoji'
        ? 3
        : clueId === 'flagColors'
          ? Math.min(3, flagColorCount)
          : TWO_STAGE_CLUE_IDS.has(clueId)
            ? 2
            : 1;
    return total + count;
  }, 0);

/** Round's starting score: `totalReveals` rounded up to the nearest ten (e.g. 26 possible
 * clues -> 30), a round number rather than depending on the exact current clues. Goes down
 * by 1 for each clue picked (they all have the same "cost" now): finding it fast (few clues
 * used) leaves a higher — and thus more won — remaining score. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

/** Round's place: drawn at random among places of the chosen difficulty (falls back to the
 * whole pool if the filter is empty, which shouldn't happen with 446 places spread over 4 tiers). */
export const randomIndicesPlace = (difficulty: Difficulty): IndicesPlace => {
  const pool = INDICES_PLACES.filter((place) => place.difficulty === difficulty);
  const source = pool.length > 0 ? pool : INDICES_PLACES;
  return source[Math.floor(Math.random() * source.length)];
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

/** A group (word) of "slots" in the recap above the buzz/give-up buttons: each slot is either
 * an already-revealed letter, or `null` (a box to draw as a dash, not revealed yet). */
export type NameSkeletonSlot = string | null;

/** Number of generic boxes per word when "Word count" is known but not "Letters": just 1
 * dash per word (not the real length, which isn't known yet) — just enough to tell the
 * words apart, spaced widely (see `skeletonRow` in IndicesGameScreen). */
const GENERIC_WORD_SLOTS = 1;

/**
 * Splits the name into groups of slots for the "M _ _ _" recap above the buzz/give-up buttons.
 * `groupByWord` separates the words (the "Word count" clue revealed) instead of a single block,
 * `revealFirst` reveals the very first letter of the name (the "First letter" clue revealed),
 * `lengthKnown` (the "Letters" clue revealed) gives the real length of each box:
 * - neither known: no boxes, only the revealed letter (at most one) is kept;
 * - words known without the length: `GENERIC_WORD_SLOTS` boxes per word (indicative shape, not
 *   the real length);
 * - length known (words grouped or not): the real number of letters, per word if grouped.
 */
export const nameSkeleton = (
  name: string,
  options: { groupByWord: boolean; revealFirst: boolean; lengthKnown: boolean },
): NameSkeletonSlot[][] => {
  const words = options.groupByWord ? name.trim().split(/\s+/) : [name];
  const firstLetter = name.replace(/[^\p{L}]/gu, '')[0]?.toUpperCase() ?? null;

  if (options.groupByWord && !options.lengthKnown) {
    return words.map((_, wordIndex) =>
      Array.from({ length: GENERIC_WORD_SLOTS }, (_, letterIndex): NameSkeletonSlot =>
        options.revealFirst && wordIndex === 0 && letterIndex === 0 ? firstLetter : null,
      ),
    );
  }

  const groups = words.map((word, wordIndex) =>
    [...word.replace(/[^\p{L}]/gu, '')].map((letter, letterIndex): NameSkeletonSlot =>
      options.revealFirst && wordIndex === 0 && letterIndex === 0 ? letter.toUpperCase() : null,
    ),
  );
  if (options.lengthKnown) return groups;
  return groups.map((group) => group.filter((slot) => slot !== null)).filter((group) => group.length > 0);
};
