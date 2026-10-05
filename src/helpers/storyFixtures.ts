import { DEFAULT_ORIGIN, PLAYER_COLORS } from '@/data';
import { DEFAULT_DISTANCE_KM, MAX_SURFACE_DISTANCE_KM } from '@/games/compass/constants';
import type {
  CluePlace,
  Guess,
  Place,
  Player,
  PlayerResult,
  RoundRecord,
} from '@/types';

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
  ...partial,
});

/** A few Clues places, in the shape the game reads them from a Firestore document (country... copied in). */
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
