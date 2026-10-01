import { CLUE_ORDER } from '@/games/clues/constants';
import { charadeFor, charadeMaxStage, charadeReady } from '@/games/clues/helpers/charade';
import { HYPHEN_SLOT, type NameSkeletonSlot } from '@/games/clues/helpers/clueSkeleton';
import { personalityFor } from '@/games/clues/helpers/personality';
import { wordplayFor } from '@/games/clues/helpers/wordplay';
import type { ClueCategory, ClueId, CluePlace } from '@/types';

/** Clues that reveal in 2 clicks: tier/symbol/day-night on the 1st, exact value on the 2nd
 * (distance/elevation/population/currency/localTime); letter: first letter alone, then every
 * letter with the real per-word length. `wordplay` is a single click (the pun, once) — not here. */
const TWO_STAGE_CLUE_IDS = new Set(['distance', 'globe', 'elevation', 'population', 'currency', 'localTime', 'letter']);
/** Clues that reveal in 3 clicks. */
const THREE_STAGE_CLUE_IDS = new Set(['emoji', 'flagColors']);

/** A French city (`citiesFr`) never varies on these: same time zone, almost never the capital,
 * same flag/currency/phone code as every other French place — unlike `capital` (world capitals,
 * these genuinely vary) or `cities` (foreign cities, ditto), where the very same clue ids do
 * distinguish one place from another. Dropped from `cluesFor` for that category only. */
const CITIES_FR_EXCLUDED_CLUE_IDS = new Set<ClueId>(['localTime', 'isCapital', 'flagColors', 'currency', 'phoneCode']);

/** Which of the 3 Clues categories `place` falls into — capital first, then French city, then plain city
 * (stored on the place, see `CluePlace.category`). Exported for `cluesFor`'s own category check. */
export const placeCategory = (place: Pick<CluePlace, 'category'>): ClueCategory => place.category;

/**
 * The clue ids actually offered for `place`, in `CLUE_ORDER`'s order: a `citiesFr` place drops
 * the ones that never vary for a French city (`CITIES_FR_EXCLUDED_CLUE_IDS`), and any place
 * without a curated `personality`/`wordplay` (see `personalityFor`/`wordplayFor`) drops that one
 * too — never an empty, unclickable card for a fact/pun that simply isn't there. `charade` is the
 * same: it's only offered once EVERY one of `place`'s syllables has a curated riddle
 * (`charadeReady`) — a partially-curated charade (some syllables read as a real riddle, others
 * fall back to reading the syllable itself) is a worse experience than not offering it at all.
 */
export const cluesFor = (place: CluePlace): ClueId[] => {
  const categoryIds =
    placeCategory(place) === 'citiesFr' ? CLUE_ORDER.filter((id) => !CITIES_FR_EXCLUDED_CLUE_IDS.has(id)) : CLUE_ORDER;
  return categoryIds.filter((id) => {
    if (id === 'personality') return personalityFor(place) !== null;
    if (id === 'wordplay') return wordplayFor(place) !== null;
    if (id === 'charade') return charadeReady(place);
    return true;
  });
};

/** How many clicks one `clueId` takes to reveal everything, for `place` specifically: fixed for
 * every clue except `charade`, whose stage count depends on how many syllables `place`'s name
 * has (capped, see `charadeMaxStage`). */
const clueStageCount = (clueId: ClueId, place: CluePlace): number => {
  if (clueId === 'charade') return charadeMaxStage(charadeFor(place));
  if (THREE_STAGE_CLUE_IDS.has(clueId)) return 3;
  if (TWO_STAGE_CLUE_IDS.has(clueId)) return 2;
  return 1;
};

/** Total number of possible clues in a round for `place` if all were taken, counted multiple
 * times for the ones that reveal in stages (see `clueStageCount`) — used as the base for
 * `maxScoreForRound`. Place-dependent on two counts: which clue ids `cluesFor(place)` even offers
 * (a `citiesFr` place has fewer), and `charade`'s own variable stage count. */
export const totalRevealCount = (place: CluePlace): number =>
  cluesFor(place).reduce((total, clueId) => total + clueStageCount(clueId, place), 0);

/** Round's starting score: `totalReveals` rounded up to the nearest ten (e.g. 26 possible
 * clues -> 30), a round number rather than depending on the exact current clues. Goes down
 * by 1 for each clue picked (they all have the same "cost" now): finding it fast (few clues
 * used) leaves a higher — and thus more won — remaining score. */
export const maxScoreForRound = (totalReveals: number): number => Math.ceil(totalReveals / 10) * 10;

/** The round's current countdown score, from `revealedClueIds` and `place` alone — shared by the
 * local game and the online host's own scoring effect (`useOnlineClueGame`), so both compute the
 * exact same number from the exact same input. `vowels` isn't a normal clue (see its own doc
 * comment in `types/index.ts`): it's excluded from the linear countdown and instead drops the
 * round straight to 1, if it was still above that. */
export const remainingScore = (revealedClueIds: ClueId[], place: CluePlace): number => {
  const maxScore = maxScoreForRound(totalRevealCount(place));
  const vowelsRevealed = revealedClueIds.includes('vowels');
  const countdownRemaining = maxScore - revealedClueIds.filter((id) => id !== 'vowels').length;
  return vowelsRevealed ? Math.min(countdownRemaining, 1) : countdownRemaining;
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

/** Turns raw typed text into the very same box-group shape a real name skeleton has (one group
 * per space-separated word, a hyphen as its own `HYPHEN_SLOT`) — used before the real shape is
 * known at all (the "letter" clue's 1st click or none yet), so what's being typed still reads as
 * boxed letters rather than a plain line, the same way it will once the shape is known. Never has
 * a blank slot: every character actually typed gets one, nothing more. */
export const typedSkeleton = (text: string): NameSkeletonSlot[][] =>
  text.trim() === ''
    ? []
    : text
        .trim()
        .split(/\s+/)
        .map((word) => [...word].map((char): NameSkeletonSlot => (char === '-' ? HYPHEN_SLOT : char.toUpperCase())));
