import { CLUE_PLACES, isCapitalPlace, isFrenchCityPlace } from '@/data';
import { CLUE_ORDER } from '@/games/clues/constants';
import { pickLeastDrawn, type ClueDrawHistory } from '@/games/clues/helpers/clueHistory';
import { HYPHEN_SLOT, type NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import { effectiveDifficulty } from '@/games/compass/helpers/places';
import type { Language } from '@/i18n';
import type { ClueId, Difficulty, ClueCategory, CluePlace } from '@/types';

/** Clues that reveal in 2 clicks: tier/symbol/day-night on the 1st, exact value on the 2nd
 * (distance/elevation/population/currency/localTime); letter: first letter alone, then every
 * letter with the real per-word length. */
const TWO_STAGE_CLUE_IDS = new Set(['distance', 'elevation', 'population', 'currency', 'localTime', 'letter']);
/** Clues that reveal in 3 clicks. */
const THREE_STAGE_CLUE_IDS = new Set(['emoji', 'flagColors']);

/** Total number of possible clues in a round if all were taken, counted multiple times
 * for the ones that reveal in stages (emoji: 3 clicks; flag: always 3 — 1 color, then every color
 * regardless of how many the flag actually has, then the actual flag;
 * distance/elevation/population/currency/localTime/letter: 2) — used as the base for
 * `maxScoreForRound`. */
export const totalRevealCount = (): number =>
  CLUE_ORDER.reduce((total, clueId) => {
    const count = THREE_STAGE_CLUE_IDS.has(clueId) ? 3 : TWO_STAGE_CLUE_IDS.has(clueId) ? 2 : 1;
    return total + count;
  }, 0);

/** Round's starting score: `totalReveals` rounded up to the nearest ten (e.g. 26 possible
 * clues -> 30), a round number rather than depending on the exact current clues. Goes down
 * by 1 for each clue picked (they all have the same "cost" now): finding it fast (few clues
 * used) leaves a higher — and thus more won — remaining score. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

/** The round's current countdown score, from `revealedClueIds` alone — shared by the local game
 * and the online host's own scoring effect (`useOnlineClueGame`), so both compute the exact same
 * number from the exact same input. `vowels` isn't a normal clue (see its own doc comment in
 * `types/index.ts`): it's excluded from the linear countdown and instead drops the round straight
 * to 1, if it was still above that. */
export const remainingScore = (revealedClueIds: ClueId[]): number => {
  const maxScore = maxScoreForRound(totalRevealCount());
  const vowelsRevealed = revealedClueIds.includes('vowels');
  const countdownRemaining = maxScore - revealedClueIds.filter((id) => id !== 'vowels').length;
  return vowelsRevealed ? Math.min(countdownRemaining, 1) : countdownRemaining;
};

/** Round's place: among places matching both the chosen difficulty and the chosen categories
 * (falls back to the whole pool if the filter is empty), prefers whichever have been drawn the
 * fewest times per `history` — never-drawn places first, then, once everything in the pool has
 * come up at least once, cycles through the least-drawn ones instead of repeating at random. See
 * `pickLeastDrawn`/`recordClueDraw` in helpers/clueHistory.ts. Each place falls into
 * exactly one of the 3 Clues categories — capital first, then French city, then plain city
 * (see `isCapitalPlace`/`isFrenchCityPlace`, cross-referenced from Compass). */
const clueCategoryOf = (place: Pick<CluePlace, 'name' | 'code'>): ClueCategory =>
  isCapitalPlace(place) ? 'capital' : isFrenchCityPlace(place) ? 'citiesFr' : 'cities';

export const randomCluePlace = (
  difficulty: Difficulty,
  categories: ClueCategory[],
  language: Language,
  history: ClueDrawHistory = {},
): CluePlace => {
  const pool = CLUE_PLACES.filter(
    (place) => categories.includes(clueCategoryOf(place)) && effectiveDifficulty(place, language) === difficulty,
  );
  const source = pool.length > 0 ? pool : CLUE_PLACES;
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

/** Total number of letter slots across every group of a name skeleton (letters only, word
 * separators excluded) — the cap on how many letters can be typed once the "letter" clue's 3rd
 * click (the real per-word length) is known, see `overlayTypedLetters`. */
export const skeletonLetterCount = (groups: NameSkeletonSlot[][]): number =>
  groups.reduce((total, group) => total + group.filter((slot) => slot !== HYPHEN_SLOT).length, 0);

/** Live-fills a name skeleton with what's been typed so far, once the real shape is known (the
 * "letter" clue's 3rd click): each slot shows the typed letter at its position once typed that
 * far, falling back to whatever the clue itself revealed (or a blank) before that. Typed
 * characters are consumed positionally across every slot, revealed or not — the player types the
 * whole name from the start, not just its hidden parts. */
export const overlayTypedLetters = (groups: NameSkeletonSlot[][], typed: string): NameSkeletonSlot[][] => {
  const typedLetters = [...typed.replace(/[^\p{L}]/gu, '')];
  let index = 0;
  return groups.map((group) =>
    group.map((slot) => {
      if (slot === HYPHEN_SLOT) return slot;
      const typedLetter = typedLetters[index];
      index += 1;
      return typedLetter !== undefined ? typedLetter.toUpperCase() : slot;
    }),
  );
};
