import {
  BOARD_PADDING_RATIO,
  boardDimensionsFor,
  createProjector,
  projectPoints,
} from '@/games/contour/components/ContourBoard';
import { CLUE_PLACES, CONTOURS, DEFAULT_ORIGIN, PLACES, PLAYER_COLORS } from '@/data';
import { DEFAULT_DISTANCE_KM, MAX_STRAIGHT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import type { CluePlace, ContourCountry, Guess, Place, Player, PlayerResult, Point2D, RoundRecord } from '@/types';

import { bearingDeg, distanceKm, normalizeBearing } from './geo';
import { applyBestBonus, scoreRound } from '@/games/compass/helpers/scoring';

// Sample data shared by every component's `.stories.tsx` — pulled from the app's own real data
// (PLACES/CLUE_PLACES/CONTOURS) rather than invented, same spirit as the admin gallery this
// replaced. Lives here (not in `admin/`) so a component's story never depends on admin code —
// admin already depends on `src/` via its `@/` alias, never the other way around.

const findPlace = (name: string, code: string): Place =>
  PLACES.find((place) => place.name === name && place.code === code)!;

const findCluePlace = (name: string, code: string): CluePlace =>
  CLUE_PLACES.find((place) => place.name === name && place.code === code)!;

/** Has a French trivia description (see PlaceCard's reveal state) — used wherever a "revealed"
 * Compass place is needed. */
export const SAMPLE_PLACE_REVEALED: Place = findPlace('Tokyo', 'JP');

/** A different place for the "still guessing" PlaceCard state. */
export const SAMPLE_PLACE_GUESSING: Place = findPlace('Machu Picchu', 'PE');

export const SAMPLE_CLUE_PLACE: CluePlace = findCluePlace('Tokyo', 'JP');

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
 * through the real scoring helpers — every number RoundResult shows is exactly what the real game
 * would compute for these guesses, not invented. */
const SAMPLE_GUESSES: Guess[] = [
  { bearing: normalizeBearing(TRUE_BEARING + 2), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.97), inclination: 0 },
  { bearing: normalizeBearing(TRUE_BEARING - 18), distanceKm: Math.round(TRUE_DISTANCE_KM * 1.35), inclination: 0 },
  { bearing: normalizeBearing(TRUE_BEARING + 55), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.4), inclination: 0 },
];

const SAMPLE_RESULTS: PlayerResult[] = applyBestBonus(
  SAMPLE_GUESSES.map((guess) => ({
    guess,
    score: scoreRound(ORIGIN, SAMPLE_PLACE_REVEALED, guess, { straightLine: false }),
  })),
);

export const SAMPLE_ROUND_RECORD: RoundRecord = { place: SAMPLE_PLACE_REVEALED, results: SAMPLE_RESULTS };

/** Round 1: cumulative totals equal this round's own totals. */
export const SAMPLE_TOTALS: number[] = SAMPLE_RESULTS.map((result) => result.score.total);

export const SAMPLE_MAX_SURFACE_KM = MAX_SURFACE_DISTANCE_KM;
export const SAMPLE_MAX_STRAIGHT_KM = MAX_STRAIGHT_DISTANCE_KM;
export const SAMPLE_DISTANCE_KM = DEFAULT_DISTANCE_KM;

/** Bearing/distance from the same default origin to the Clues sample place — real values for
 * ClueCard's `bearing`/`distance` clues. */
export const SAMPLE_CLUE_BEARING = bearingDeg(ORIGIN, SAMPLE_CLUE_PLACE.coordinates);
export const SAMPLE_CLUE_DISTANCE_KM = distanceKm(ORIGIN, SAMPLE_CLUE_PLACE.coordinates);

// --- ContourBoard (Silhouette) ---
// Same fit/projector math the real game (ContourGameScreen's `projectRound`) and the admin's
// ContourEditor preview both use — see `boardDimensionsFor`'s own doc comment: it's what keeps a
// neighbor's curated `x`/`y` fraction landing at the same relative spot everywhere.

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
