import {
  BOARD_PADDING_RATIO,
  boardDimensionsFor,
  createProjector,
  projectPoints,
} from '@/games/contour/components/ContourBoard';
import { DEFAULT_ORIGIN, PLAYER_COLORS } from '@/data';
import { DEFAULT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import type {
  CluePlace,
  ContourCountry,
  ContourRoundCountry,
  Guess,
  Place,
  Player,
  PlayerResult,
  Point2D,
  RoundRecord,
} from '@/types';

import { projectRound, roundGeometry } from '@/games/contour/helpers/roundBoard';

import { bearingDeg, distanceKm, normalizeBearing } from './geo';
import { applyBestBonus, scoreRound } from '@/games/compass/helpers/scoring';

// Sample data shared by every component's `.stories.tsx` and by the tests that need a few places: small,
// hand-written and self-contained (the game's real data lives in Firestore). Lives here (not in `admin/`)
// so a component's story never depends on admin code — admin already depends on `src/` via its `@/`
// alias, never the other way around.

/** A few Compass places, in the shape the game reads them from a Firestore document. */
export const FIXTURE_PLACES: Place[] = [
  {
    name: 'Tokyo',
    code: 'JP',
    country: { fr: 'Japon', en: 'Japan' },
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    category: 'capital',
    difficulty: 'easy',
    description: 'Plus grande agglomération du monde, elle s’appelait Edo avant de devenir la capitale en 1868.',
    wikiFr: 'Tokyo',
    wikiEn: 'Tokyo',
  },
  {
    name: 'Paris',
    code: 'FR',
    country: { fr: 'France', en: 'France' },
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    category: 'capital',
    difficulty: 'easy',
  },
  {
    name: 'Berlin',
    code: 'DE',
    country: { fr: 'Allemagne', en: 'Germany' },
    coordinates: { latitude: 52.52, longitude: 13.405 },
    category: 'capital',
    difficulty: 'easy',
  },
  {
    name: 'Rome',
    code: 'IT',
    country: { fr: 'Italie', en: 'Italy' },
    coordinates: { latitude: 41.9028, longitude: 12.4964 },
    category: 'capital',
    difficulty: 'easy',
  },
];

const clue = (
  partial: Partial<CluePlace> & Pick<CluePlace, 'key' | 'name' | 'code' | 'country' | 'coordinates'>,
): CluePlace => ({
  difficulty: 'easy',
  category: 'cities',
  positionInCountry: 'center',
  population: 1_000_000,
  climateEmoji: '⛅',
  elevationMeters: 10,
  timezone: 'Europe/Paris',
  phoneCode: '+33',
  currency: '€',
  currencyName: 'Euro',
  flagColors: [
    { id: 'blue', hex: '#0055A4', percent: 33 },
    { id: 'white', hex: '#FFFFFF', percent: 33 },
    { id: 'red', hex: '#EF4135', percent: 33 },
  ],
  airportCode: 'CDG',
  emojis: ['🏙️', '🎨', '🥖'],
  syllables: [],
  riddles: [],
  ...partial,
});

/** A few Clues places, in the shape the game reads them from a Firestore document (country, riddles... copied in). */
export const FIXTURE_CLUE_PLACES: CluePlace[] = [
  clue({
    key: 'par',
    name: 'Paris',
    code: 'FR',
    country: 'France',
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    category: 'capital',
    positionInCountry: 'n',
    population: 2_100_000,
    airportCode: 'CDG',
    emojis: ['🗼', '🥐', '🎨'],
    syllables: ['pa', 'ris'],
    riddles: ['pas, sans le s', 'un fruit rouge, en anglais'],
  }),
  clue({
    key: 'tok',
    name: 'Tokyo',
    code: 'JP',
    country: 'Japon',
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    category: 'capital',
    positionInCountry: 'e',
    population: 14_000_000,
    timezone: 'Asia/Tokyo',
    phoneCode: '+81',
    currency: '¥',
    currencyName: 'Yen',
    flagColors: [
      { id: 'white', hex: '#FFFFFF', percent: 80 },
      { id: 'red', hex: '#BC002D', percent: 20 },
    ],
    airportCode: 'HND',
    emojis: ['🗼', '🍣', '🌸'],
    syllables: ['to', 'kyo'],
    riddles: ['un orteil, en anglais', null],
  }),
  clue({
    key: 'new',
    name: 'New York',
    code: 'US',
    country: 'États-Unis',
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    positionInCountry: 'ne',
    population: 8_300_000,
    timezone: 'America/New_York',
    phoneCode: '+1',
    currency: '$',
    currencyName: 'Dollar',
    airportCode: 'JFK',
    emojis: ['🗽', '🚕', '🍎'],
    syllables: ['new', 'york'],
    riddles: [null, null],
  }),
  clue({
    key: 'sai',
    name: 'Saint-Malo',
    code: 'FR',
    country: 'France',
    coordinates: { latitude: 48.6493, longitude: -2.0257 },
    category: 'citiesFr',
    positionInCountry: 'nw',
    population: 46_000,
    airportCode: 'DNR',
    emojis: ['🏰', '🌊', '⚓'],
    syllables: ['saint', 'ma', 'lo'],
    riddles: [null, null, null],
  }),
  clue({
    key: 'mar',
    name: 'Marseille',
    code: 'FR',
    country: 'France',
    coordinates: { latitude: 43.2965, longitude: 5.3698 },
    category: 'citiesFr',
    positionInCountry: 'se',
    population: 870_000,
    airportCode: 'MRS',
    emojis: ['⚓', '🐟', '☀️'],
    syllables: ['mar', 'seille'],
    riddles: [null, null],
  }),
];

const findPlace = (name: string, code: string): Place =>
  FIXTURE_PLACES.find((place) => place.name === name && place.code === code)!;

const findCluePlace = (name: string, code: string): CluePlace =>
  FIXTURE_CLUE_PLACES.find((place) => place.name === name && place.code === code)!;

/** Has a French trivia description (see PlaceCard's reveal state) — the sample Compass place, used by
 * every story that needs one (the guessing and the revealed states alike). */
export const SAMPLE_PLACE_REVEALED: Place = findPlace('Tokyo', 'JP');

export const SAMPLE_CLUE_PLACE: CluePlace = findCluePlace('Tokyo', 'JP');

/** A multi-word name with a space ("New York"), for the letter clue's skeleton (one group per
 * word) — see `SAMPLE_CLUE_PLACE_HYPHEN` for the hyphen case. */
export const SAMPLE_CLUE_PLACE_SPACE: CluePlace = findCluePlace('New York', 'US');

/** A name with a hyphen ("Saint-Malo"), for the letter clue's skeleton (the hyphen sits in place,
 * outside any letter slot — see `HYPHEN_SLOT`). */
export const SAMPLE_CLUE_PLACE_HYPHEN: CluePlace = findCluePlace('Saint-Malo', 'FR');

/** A French city (`citiesFr`), for `cluesFor`'s reduced clue set: same time zone/flag/currency/
 * phone code as every other French place, so those clues are dropped for it (see `ClueGrid`). */
export const SAMPLE_CLUE_PLACE_FR: CluePlace = findCluePlace('Marseille', 'FR');

export const SAMPLE_PLAYERS: Player[] = [
  { name: 'Zoé', color: PLAYER_COLORS[0] },
  { name: 'Max', color: PLAYER_COLORS[1] },
  { name: 'Léo', color: PLAYER_COLORS[2] },
];

/** Rough outlines of France and two countries it shares edges with (the same vertices, so the border
 * split has something to cut): enough to draw a board, not geography. */
const ring = (points: [number, number][]): [number, number][] => [...points, points[0]];

const FRANCE: ContourCountry = {
  code: 'FR',
  points: ring([
    [2.5, 51.1],
    [4.2, 49.9],
    [6.2, 49.5],
    [8.2, 48.9],
    [7.6, 47.6],
    [6.0, 46.2],
    [7.0, 45.9],
    [7.6, 44.1],
    [6.9, 43.6],
    [3.1, 43.1],
    [3.0, 42.4],
    [1.7, 42.5],
    [-0.7, 43.3],
    [-1.8, 43.4],
    [-1.2, 46.0],
    [-4.5, 48.0],
    [-1.6, 48.7],
    [1.5, 50.1],
  ]),
  neighbors: [
    { type: 'country', code: 'ES', x: 0.3, y: 0.95 },
    { type: 'country', code: 'BE', x: 0.62, y: 0.05 },
    { type: 'country', code: 'DE', x: 0.95, y: 0.25 },
    { type: 'country', code: 'IT', x: 0.9, y: 0.75 },
  ],
  centerLabel: { x: 0.5, y: 0.5 },
  difficulty: 'easy',
};

/** Contours the sample board is fit against: France and, around it, Spain and Belgium. */
export const FIXTURE_CONTOURS: ContourCountry[] = [
  FRANCE,
  {
    code: 'ES',
    points: ring([
      [-1.8, 43.4],
      [-0.7, 43.3],
      [1.7, 42.5],
      [3.0, 42.4],
      [3.2, 41.8],
      [0.8, 40.5],
      [-1.0, 37.0],
      [-6.0, 36.5],
      [-9.0, 38.0],
      [-8.6, 42.0],
    ]),
    neighbors: [],
    centerLabel: { x: 0.5, y: 0.5 },
    difficulty: 'easy',
  },
  {
    code: 'BE',
    points: ring([
      [2.5, 51.1],
      [3.4, 51.4],
      [5.8, 51.0],
      [6.2, 49.5],
      [4.2, 49.9],
    ]),
    neighbors: [],
    centerLabel: { x: 0.5, y: 0.5 },
    difficulty: 'intermediate',
  },
];

const NAMES: Record<string, { fr: string; en: string }> = {
  FR: { fr: 'France', en: 'France' },
  ES: { fr: 'Espagne', en: 'Spain' },
  BE: { fr: 'Belgique', en: 'Belgium' },
  DE: { fr: 'Allemagne', en: 'Germany' },
  IT: { fr: 'Italie', en: 'Italy' },
};

export const SAMPLE_CONTOUR_COUNTRY: ContourRoundCountry = {
  ...FRANCE,
  ...NAMES.FR,
  neighbors: FRANCE.neighbors.map((neighbor) => ({ ...neighbor, ...NAMES[neighbor.code] })),
  capital: { name: 'Paris', longitude: 2.3522, latitude: 48.8566 },
  cities: [
    { name: 'Lyon', longitude: 4.8357, latitude: 45.764 },
    { name: 'Marseille', longitude: 5.3698, latitude: 43.2965 },
    { name: 'Bordeaux', longitude: -0.5792, latitude: 44.8378 },
  ],
};

const ORIGIN = DEFAULT_ORIGIN.coordinates;
const TRUE_BEARING = bearingDeg(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);
const TRUE_DISTANCE_KM = distanceKm(ORIGIN, SAMPLE_PLACE_REVEALED.coordinates);

/** Three plausible guesses (one spot-on, one overshooting, one wide off) for the same round, fed
 * through the real scoring helpers — every number RoundResult shows is exactly what the real game
 * would compute for these guesses, not invented. */
const SAMPLE_GUESSES: Guess[] = [
  { bearing: normalizeBearing(TRUE_BEARING + 2), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.97) },
  { bearing: normalizeBearing(TRUE_BEARING - 18), distanceKm: Math.round(TRUE_DISTANCE_KM * 1.35) },
  { bearing: normalizeBearing(TRUE_BEARING + 55), distanceKm: Math.round(TRUE_DISTANCE_KM * 0.4) },
];

const SAMPLE_RESULTS: PlayerResult[] = applyBestBonus(
  SAMPLE_GUESSES.map((guess) => ({
    guess,
    score: scoreRound(ORIGIN, SAMPLE_PLACE_REVEALED, guess),
  })),
);

export const SAMPLE_ROUND_RECORD: RoundRecord = { place: SAMPLE_PLACE_REVEALED, results: SAMPLE_RESULTS };

/** Round 1: cumulative totals equal this round's own totals. */
export const SAMPLE_TOTALS: number[] = SAMPLE_RESULTS.map((result) => result.score.total);

export const SAMPLE_MAX_SURFACE_KM = MAX_SURFACE_DISTANCE_KM;

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

/** France fit to the same box, with the countries touching it (`neighborOutlines`) and its outline cut
 * into coast and shared borders (`coastlines`/`borders`): what the game passes to `ContourBoard`. */
export const SAMPLE_CONTOUR_BOARD = projectRound(
  SAMPLE_CONTOUR_COUNTRY,
  CONTOUR_BOARD_MAX_WIDTH,
  CONTOUR_BOARD_MAX_HEIGHT,
  roundGeometry(SAMPLE_CONTOUR_COUNTRY, 0, FIXTURE_CONTOURS),
);

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
