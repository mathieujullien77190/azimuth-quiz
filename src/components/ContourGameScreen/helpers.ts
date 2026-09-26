import { CATEGORIES, PLACES } from '@/constants';
import { flagEmoji, countryName } from '@/constants/places/countries';
import { shuffle } from '@/helpers';
import type { Language } from '@/i18n';
import type { Category, ContourCountry, ContourNeighbor, ContourRoundRecord, Difficulty, Place } from '@/types';

// Order `randomPlacesFor` falls back through when the requested tier alone doesn't have enough
// places for a country — easiest first, since a too-easy city still beats no city at all.
const DIFFICULTY_FALLBACK_ORDER: Difficulty[] = ['easy', 'intermediate', 'hard'];

// Which of Boussole's own categories get their own icon on reveal instead of the plain truth dot
// (see `placeEmoji`) — deliberately not every category: a city/French city still reads fine as a
// plain dot (there's nothing more specific to draw), and `kids` is excluded from Contour
// altogether (see `randomPlacesFor`), so it never reaches `placeEmoji` in the first place.
const ICON_CATEGORIES: ReadonlySet<Category> = new Set(['capital', 'mountains', 'landmarks', 'nature']);

/** Tab order (and who plays first) for a round: pure rotation starting from player
 * `roundIndex % playerCount`, same idea as Boussole's `rotatedOrder` (GameScreen/helpers.ts). */
export const rotatedOrder = (roundIndex: number, playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, i) => (roundIndex + i) % playerCount);

/** Each player's point total (guess + every place's city score), in player order. */
export const contourPlayerTotals = (records: ContourRoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );

/** Random country for a new round, from whichever countries match `difficulty` (same spirit as
 * Boussole filtering `PLACES` by difficulty), avoiding an immediate repeat of `excludeCode`
 * whenever the filtered pool has more than one option — the `easy` (FR/ES) and `hard` (NO) pools
 * each hold exactly one country (see `codec.ts`/`countries.json`'s curated `contour.difficulty`),
 * so that exclusion never actually applies there and either draws the same country every time;
 * it's the much larger `intermediate` pool — most countries, including every auto-generated one
 * (see `scripts/generateContours.mjs`) — where the anti-repeat exclusion actually matters. */
export const randomCountry = (countries: ContourCountry[], difficulty: Difficulty, excludeCode?: string): ContourCountry => {
  const pool = countries.filter((country) => country.difficulty === difficulty);
  const candidates = pool.length > 1 ? pool.filter((country) => country.code !== excludeCode) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/** Up to `count` distinct random Boussole places (see PLACES in constants/places, any category)
 * for the given country, preferring `difficulty` (same tier as `randomCountry`'s own filtering)
 * but topping up from the other tiers — easiest first (`DIFFICULTY_FALLBACK_ORDER`) — whenever
 * that tier alone doesn't have enough: most countries only have a handful of places per
 * difficulty, so a strict single-tier filter would leave the city phase short far too often.
 * Still fewer (down to none) if the country doesn't have that many places overall; the caller
 * must handle a short (or empty) result. */
export const randomPlacesFor = (countryCode: string, count: number, difficulty: Difficulty): Place[] => {
  const matching = (tier: Difficulty): Place[] =>
    PLACES.filter(
      (place) => place.code === countryCode && place.difficulty === tier && place.category !== 'kids' && !place.excludeFromContour,
    );

  const picked = shuffle(matching(difficulty));
  for (const tier of DIFFICULTY_FALLBACK_ORDER) {
    if (picked.length >= count || tier === difficulty) continue;
    picked.push(...shuffle(matching(tier)));
  }
  return picked.slice(0, count);
};

/** Category icon (see `ICON_CATEGORIES`) for a place drawn as the truth marker on reveal, in
 * place of the plain dot — `undefined` for a category with nothing more specific to draw (a
 * city/French city), which keeps the existing plain dot instead. */
export const placeEmoji = (place: Place): string | undefined =>
  ICON_CATEGORIES.has(place.category) ? CATEGORIES.find((category) => category.id === place.category)?.emoji : undefined;

/** Tier-1 icon for a curated neighbor entry: its flag. */
export const neighborIcon = (neighbor: ContourNeighbor): string => flagEmoji(neighbor.code);

/** Tier-3 display name for a curated neighbor entry, in the active UI language: resolved via the
 * shared country-name table. */
export const neighborName = (neighbor: ContourNeighbor, language: Language): string => countryName(neighbor.code, language);

/** Normalizes a guessed country name for comparison: mirrors IndicesGameScreen/helpers.ts's own
 * `normalizePlaceGuess` (lowercased, accents/spaces/punctuation all dropped outright, not just
 * collapsed — "Côte d'Ivoire", "Cote d Ivoire" and "Coted'Ivoire" all compare equal) — kept as
 * its own small copy here rather than a cross-component import, per this repo's one-folder-per-
 * feature convention (see CLAUDE.md's `react-structure`). */
export const normalizeContourGuess = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
