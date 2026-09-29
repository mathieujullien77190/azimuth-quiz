import countryContoursData from '@/data/places/countryContours.json';
import type { ContourCenterLabel, ContourCountry, ContourDataRow, Difficulty } from '@/types';

// Fallback if a country's contour data omits it: the board's own dead center.
const DEFAULT_CENTER_LABEL: ContourCenterLabel = { x: 0.5, y: 0.5 };

// Curated, not derived (outline recognizability is a judgment call): France and Spain are widely
// recognizable, Norway's fjorded coast makes it the hardest to place blind, everything else
// (including every auto-generated country — see scripts/generateContours.mjs) is the default
// middle tier.
const DEFAULT_CONTOUR_DIFFICULTY: Difficulty = 'intermediate';

/**
 * Builds the fully-resolved `ContourCountry` list from `countryContours.json`'s own rows (see
 * `data/places/countries.ts`'s doc comment) — a country not in that file at all has no
 * Contour/Silhouette data and simply isn't in the result. `neighbors`/`centerLabel`/`difficulty`
 * each fall back to their own default when the row doesn't specify it, same defaults regardless
 * of whether the country was hand-curated or auto-generated.
 */
export const decodeContours = (rows: Record<string, ContourDataRow>): ContourCountry[] =>
  Object.entries(rows).map(([code, contour]) => ({
    code,
    points: contour.points,
    neighbors: contour.neighbors ?? [],
    centerLabel: contour.centerLabel ?? DEFAULT_CENTER_LABEL,
    difficulty: contour.difficulty ?? DEFAULT_CONTOUR_DIFFICULTY,
  }));

const COUNTRY_CONTOURS = countryContoursData as unknown as Record<string, ContourDataRow>;

export const CONTOURS: ContourCountry[] = decodeContours(COUNTRY_CONTOURS);
