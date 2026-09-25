import type { CountryRow } from '@/constants/places/countries';
import countriesData from '@/constants/places/countries.json';
import type { ContourCenterLabel, ContourCountry, Difficulty } from '@/types';

const COUNTRIES = countriesData as unknown as Record<string, CountryRow>;

// Fallback if a country's contour data omits it: the board's own dead center.
const DEFAULT_CENTER_LABEL: ContourCenterLabel = { x: 0.5, y: 0.5 };

// Curated, not derived (outline recognizability is a judgment call): France and Spain are widely
// recognizable, Norway's fjorded coast makes it the hardest to place blind, everything else
// (including every auto-generated country — see scripts/generateContours.mjs) is the default
// middle tier.
const DEFAULT_CONTOUR_DIFFICULTY: Difficulty = 'intermediate';

/**
 * Builds the fully-resolved `ContourCountry` list from `countries.json` rows: only a row with a
 * 7th (`contour`) element produces one, everyone else is skipped outright (see `CountryRow`) —
 * `neighbors`/`centerLabel`/`difficulty` each fall back to their own default when the row's
 * `contour` doesn't specify it, same defaults regardless of whether the country was hand-curated
 * or auto-generated.
 */
export const decodeContours = (rows: Record<string, CountryRow>): ContourCountry[] =>
  Object.entries(rows)
    .filter((entry) => entry[1][6] !== undefined)
    .map(([code, row]) => {
      const contour = row[6]!;
      return {
        code,
        points: contour.points,
        neighbors: contour.neighbors ?? [],
        centerLabel: contour.centerLabel ?? DEFAULT_CENTER_LABEL,
        difficulty: contour.difficulty ?? DEFAULT_CONTOUR_DIFFICULTY,
      };
    });

export const CONTOURS: ContourCountry[] = decodeContours(COUNTRIES);
