import type { Category, Difficulty, GameSettings, Origin, Zone } from '@/types';

export * from './theme';
export * from './indices';
export { PLACES } from './places';

// --- Score ---
export const MAX_ROUND_POINTS = 1000;
export const MAX_DIRECTION_POINTS = 500;
export const MAX_DISTANCE_POINTS = 500;
// Bonus for the player(s) closest in the round (1/5 of their category's max), in
// multiplayer only: no one to beat in solo.
export const BEST_BONUS_RATIO = 0.2;

// Direction: 0 points starting from this error (in degrees).
export const DIRECTION_TOLERANCE_DEG = 90;
// Distance: 0 points when the estimate is off by this factor (too big or too small).
export const DISTANCE_TOLERANCE_RATIO = 4;
// Points decay curve (>1 = steeper near the right answer).
export const SCORE_CURVE_EXPONENT = 1.5;

// --- Geography ---
export const EARTH_RADIUS_KM = 6371;
export const MIN_DISTANCE_KM = 10;
/** Largest surface distance: half the Earth's circumference. */
export const MAX_SURFACE_DISTANCE_KM = 20000;
/** Largest straight-line distance: the Earth's diameter (vertical inclination). */
export const MAX_STRAIGHT_DISTANCE_KM = 12742;
// Marks shown below the distance sliders (logarithmic scale).
export const DISTANCE_MARKS_KM = [100, 1000, 10000] as const;
export const DEFAULT_DISTANCE_KM = 1000;
export const MAX_INCLINATION_DEG = 90;

// Places closer than this to the starting point: excluded (too easy, unstable heading).
export const MIN_PLACE_DISTANCE_KM = 150;

export const DEFAULT_ORIGIN: Origin = {
  name: 'Paris',
  coordinates: { latitude: 48.8566, longitude: 2.3522 },
  isDevicePosition: false,
};
// Beyond this, we start from DEFAULT_ORIGIN rather than blocking the player.
export const LOCATION_TIMEOUT_MS = 6000;

// --- Storage ---
export const BEST_SCORE_STORAGE_KEY = 'fullazimut:best-score';
export const SETTINGS_STORAGE_KEY = 'fullazimut:settings';
export const LANGUAGE_STORAGE_KEY = 'fullazimut:language';
/** Once the home screen's UFO is caught (clicked), it stops moving forever. */
export const UFO_CAUGHT_STORAGE_KEY = 'fullazimut:ufo-caught';

// --- Ranks (solo): the title comes from translations.endScreen.ranks (same order). ---
export const RANKS = [
  { minRatio: 0.85, emoji: '🧭' },
  { minRatio: 0.65, emoji: '⚓' },
  { minRatio: 0.45, emoji: '⛵' },
  { minRatio: 0.25, emoji: '🪢' },
  { minRatio: 0, emoji: '🌊' },
] as const;

// --- Game options ---
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;
export const ROUND_OPTIONS = [5, 10, 15, 20] as const;

/** Fallback first names for a name field left empty: a random first name rather than "Player 1",
 * "Player 2"... Used both by SetupScreen (cosmetic hint, order reshuffled) and by
 * playerDisplayName (stable identity for the whole game, chosen by index). */
export const NAME_PLACEHOLDERS = [
  'Zoé',
  'Max',
  'Léo',
  'Nina',
  'Théo',
  'Mia',
  'Noa',
  'Iris',
  'Timéo',
  'Luna',
  'Gaspard',
  'Chloé',
] as const;

// Spread roughly every ~50° of hue (red, green, cyan, blue, violet, pink) to stay
// distinct from each other, and away from the accent's amber/yellow and the Night theme's
// truth color (none between 3° and 85°) so no player picks them by chance.
export const PLAYER_COLORS = ['#EF4444', '#16A34A', '#0891B2', '#2563EB', '#9333EA', '#DB2777'] as const;

// Label/description: see translations.setup.categories / .difficulties / .zones (same id).
export const CATEGORIES: { id: Category; emoji: string }[] = [
  { id: 'cities', emoji: '🏙️' },
  // Star: the standard map symbol for a capital city.
  { id: 'capital', emoji: '⭐' },
  { id: 'mountains', emoji: '⛰️' },
  { id: 'landmarks', emoji: '🏛️' },
  { id: 'nature', emoji: '🌿' },
  { id: 'kids', emoji: '🧒' },
];

export const DIFFICULTIES: { id: Difficulty; emoji: string }[] = [
  { id: 'easy', emoji: '🟢' },
  { id: 'intermediate', emoji: '🟡' },
  { id: 'hard', emoji: '🟠' },
  { id: 'master', emoji: '🔴' },
];

export const ZONES: { id: Zone }[] = [{ id: 'france' }, { id: 'europe' }, { id: 'world' }];

/** European countries (the zone filter adds a longitude bound for Russia and Turkey). */
export const EUROPE_CODES: readonly string[] = [
  'FR',
  'GB',
  'DE',
  'ES',
  'IT',
  'PT',
  'NL',
  'BE',
  'CH',
  'AT',
  'CZ',
  'PL',
  'HU',
  'RO',
  'GR',
  'DK',
  'SE',
  'NO',
  'FI',
  'IS',
  'IE',
  'TR',
  'RU',
  'UA',
];
export const EUROPE_MAX_LONGITUDE = 45;
export const EUROPE_MIN_LATITUDE = 30;

export const DEFAULT_SETTINGS: GameSettings = {
  playerNames: [''],
  categories: ['cities', 'capital', 'mountains', 'landmarks', 'nature'],
  // Single choice (radio).
  difficulties: ['intermediate'],
  zone: 'world',
  rounds: 5,
  straightLine: false,
  useGps: true,
  // Paris by default, like DEFAULT_ORIGIN (see above).
  customLatitude: DEFAULT_ORIGIN.coordinates.latitude,
  customLongitude: DEFAULT_ORIGIN.coordinates.longitude,
  liveCompass: false,
  showCountry: false,
  allowRevision: true,
  hideOtherAnswers: false,
};
