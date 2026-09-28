import { flagEmoji, countryName } from '@/data/places/countries';
import type { Language } from '@/i18n';
import type { ContourCountry, ContourNeighbor, Difficulty } from '@/types';

/** Random country for a new round, from whichever countries match `difficulty` (same spirit as
 * Compass filtering `PLACES` by difficulty), avoiding an immediate repeat of `excludeCode`
 * whenever the filtered pool has more than one option — the `easy` (FR/ES) and `hard` (NO) pools
 * each hold exactly one country (see `codec.ts`/`countries.json`'s curated `contour.difficulty`),
 * so that exclusion never actually applies there and either draws the same country every time;
 * it's the much larger `intermediate` pool — most countries, including every auto-generated one
 * (see `scripts/generateContours.mjs`) — where the anti-repeat exclusion actually matters. */
export const randomCountry = (
  countries: ContourCountry[],
  difficulty: Difficulty,
  excludeCode?: string,
): ContourCountry => {
  const pool = countries.filter((country) => country.difficulty === difficulty);
  const candidates = pool.length > 1 ? pool.filter((country) => country.code !== excludeCode) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

/** Tier-1 icon for a curated neighbor entry: its flag. */
export const neighborIcon = (neighbor: ContourNeighbor): string => flagEmoji(neighbor.code);

/** Tier-3 display name for a curated neighbor entry, in the active UI language: resolved via the
 * shared country-name table. */
export const neighborName = (neighbor: ContourNeighbor, language: Language): string =>
  countryName(neighbor.code, language);

/** Normalizes a guessed country name for comparison: mirrors ClueGameScreen/helpers.ts's own
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

/** The whole online game's countries, drawn upfront by the host (one code per round): same pool and
 * anti-repeat rule as the local game's per-round draw (`randomCountry`), just called `rounds` times
 * in a row, each excluding the one before it. */
export const pickContourRoundCodes = (
  countries: ContourCountry[],
  difficulty: Difficulty,
  rounds: number,
): string[] => {
  const codes: string[] = [];
  for (let round = 0; round < rounds; round += 1) {
    codes.push(randomCountry(countries, difficulty, codes[round - 1]).code);
  }
  return codes;
};
