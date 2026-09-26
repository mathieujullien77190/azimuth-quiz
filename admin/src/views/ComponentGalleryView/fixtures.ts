import { BOARD_PADDING_RATIO, boardDimensionsFor, createProjector, projectPoints } from '@/components/ContourBoard';
import {
  CONTOURS,
  DEFAULT_DISTANCE_KM,
  DEFAULT_ORIGIN,
  INDICES_PLACES,
  MAX_STRAIGHT_DISTANCE_KM,
  MAX_SURFACE_DISTANCE_KM,
  PLACES,
  PLAYER_COLORS,
} from '@/constants';
import { applyBestBonus, bearingDeg, distanceKm, normalizeBearing, scoreRound } from '@/helpers';
import type { ContourCountry, Guess, IndicesPlace, Place, Player, PlayerResult, Point2D, RoundRecord } from '@/types';

// Every fixture below is pulled from the app's own real data (PLACES/INDICES_PLACES/CONTOURS,
// see @/constants) rather than invented — the point of this gallery is to audit the REAL
// components with data that looks like the real game, not a mockup. `find`+non-null assertion
// (not `?? fallback`) is deliberate: if one of these names ever moves/disappears from the source
// data, the gallery should fail loudly (a missing fixture) rather than silently render with `undefined`.

const findPlace = (name: string, code: string): Place => PLACES.find((place) => place.name === name && place.code === code)!;

const findIndicesPlace = (name: string, code: string): IndicesPlace =>
  INDICES_PLACES.find((place) => place.name === name && place.code === code)!;

/** Has a French trivia description (see PlaceCard's reveal state) — used wherever a "revealed"
 * Boussole place is needed. */
export const SAMPLE_PLACE_REVEALED: Place = findPlace('Tokyo', 'JP');

/** A different place for the "still guessing" PlaceCard state — Tokyo doubling as both would
 * work, but a second real place is just as easy to grab and reads better next to it. Also a
 * `landmarks` category place: gives ContourBoard's category-emoji reveal (`placeEmoji`) something
 * to show beyond the plain dot. */
export const SAMPLE_PLACE_GUESSING: Place = findPlace('Machu Picchu', 'PE');

export const SAMPLE_INDICES_PLACE: IndicesPlace = findIndicesPlace('Tokyo', 'JP');

export const SAMPLE_PLAYERS: Player[] = [
  { name: 'Zoé', color: PLAYER_COLORS[0] },
  { name: 'Max', color: PLAYER_COLORS[1] },
  { name: 'Léo', color: PLAYER_COLORS[2] },
];

/** France: hand-curated (not auto-generated), `easy` difficulty, real neighbor/centerLabel
 * positions — see CLAUDE.md's Silhouette section. */
export const SAMPLE_CONTOUR_COUNTRY: ContourCountry = CONTOURS.find((country) => country.code === 'FR')!;

const ORIGIN = DEFAULT_ORIGIN.coordinates;
const TRUE_BEARING = bearingDeg(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);
const TRUE_DISTANCE_KM = distanceKm(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);

/** Three plausible guesses (one spot-on, one overshooting, one wide off) for the same round, fed
 * through the real scoring helpers (`scoreRound`/`applyBestBonus`) — every number RoundResult
 * shows below is exactly what the real game would compute for these guesses, not invented. */
const SAMPLE_GUESSES: Guess[] = [
  { bearing: normalizeBearing(TRUE_BEARING + 2), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.97), inclination: 0 },
  { bearing: normalizeBearing(TRUE_BEARING - 18), distanceKm: Math.round(TRUE_DISTANCE_KM * 1.35), inclination: 0 },
  { bearing: normalizeBearing(TRUE_BEARING + 55), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.4), inclination: 0 },
];

const SAMPLE_RESULTS: PlayerResult[] = applyBestBonus(
  SAMPLE_GUESSES.map((guess) => ({ guess, score: scoreRound(ORIGIN, SAMPLE_PLACE_REVEALED, guess, { straightLine: false }) })),
);

export const SAMPLE_ROUND_RECORD: RoundRecord = { place: SAMPLE_PLACE_REVEALED, results: SAMPLE_RESULTS };

/** Round 1: cumulative totals equal this round's own totals. */
export const SAMPLE_TOTALS: number[] = SAMPLE_RESULTS.map((result) => result.score.total);

export const SAMPLE_MAX_SURFACE_KM = MAX_SURFACE_DISTANCE_KM;
export const SAMPLE_MAX_STRAIGHT_KM = MAX_STRAIGHT_DISTANCE_KM;
export const SAMPLE_DISTANCE_KM = DEFAULT_DISTANCE_KM;

/** Bearing/distance from the same default origin to the Indices sample place — real values for
 * IndicesClueCard's `bearing`/`distance` clues. */
export const SAMPLE_INDICES_BEARING = bearingDeg(ORIGIN, SAMPLE_INDICES_PLACE.coordinates);
export const SAMPLE_INDICES_DISTANCE_KM = distanceKm(ORIGIN, SAMPLE_INDICES_PLACE.coordinates);

// --- ContourBoard (Silhouette) ---
// Same fit/projector math the real game (ContourGameScreen's `projectRound`) and the admin's own
// existing ContourEditor preview both use — see `boardDimensionsFor`'s own doc comment: it's what
// keeps a neighbor's curated `x`/`y` fraction landing at the same relative spot everywhere.

const CONTOUR_BOARD_MAX_WIDTH = 420;
const CONTOUR_BOARD_MAX_HEIGHT = 320;

export const SAMPLE_CONTOUR_BOARD_SIZE = boardDimensionsFor(
  SAMPLE_CONTOUR_COUNTRY.points,
  CONTOUR_BOARD_MAX_WIDTH,
  CONTOUR_BOARD_MAX_HEIGHT,
);

const contourProject = createProjector(
  SAMPLE_CONTOUR_COUNTRY.points,
  SAMPLE_CONTOUR_BOARD_SIZE,
  Math.min(SAMPLE_CONTOUR_BOARD_SIZE.width, SAMPLE_CONTOUR_BOARD_SIZE.height) * BOARD_PADDING_RATIO,
);

export const SAMPLE_CONTOUR_OUTLINE: Point2D[] = projectPoints(SAMPLE_CONTOUR_COUNTRY.points, contourProject);

/** Every curated neighbor for France, already projected to board pixels (tier-1/tier-3 hints). */
export const SAMPLE_CONTOUR_NEIGHBORS = SAMPLE_CONTOUR_COUNTRY.neighbors.map((neighbor) => ({
  neighbor,
  position: {
    x: neighbor.x * SAMPLE_CONTOUR_BOARD_SIZE.width,
    y: neighbor.y * SAMPLE_CONTOUR_BOARD_SIZE.height,
  } satisfies Point2D,
}));

/** The target country's own flag/name anchor (tier-3/4 hint — see `ContourCountry.centerLabel`). */
export const SAMPLE_CONTOUR_CENTER_POSITION: Point2D = {
  x: SAMPLE_CONTOUR_COUNTRY.centerLabel.x * SAMPLE_CONTOUR_BOARD_SIZE.width,
  y: SAMPLE_CONTOUR_COUNTRY.centerLabel.y * SAMPLE_CONTOUR_BOARD_SIZE.height,
};

/** A real French place (city phase's truth marker) and a nearby "guess" a few pixels off, to show
 * the reveal-phase truth ring + player dot + dashed connector all at once. */
const SAMPLE_CONTOUR_CITY: Place = findPlace('Paris', 'FR');
export const SAMPLE_CONTOUR_TRUE_POSITION: Point2D = contourProject([
  SAMPLE_CONTOUR_CITY.coordinates.longitude,
  SAMPLE_CONTOUR_CITY.coordinates.latitude,
]);
export const SAMPLE_CONTOUR_GUESS_POSITION: Point2D = {
  x: SAMPLE_CONTOUR_TRUE_POSITION.x + 26,
  y: SAMPLE_CONTOUR_TRUE_POSITION.y - 16,
};
