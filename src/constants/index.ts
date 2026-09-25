import type { Category, Difficulty, GameSettings, Origin } from '@/types';

export * from './theme';
export * from './indices';
export * from './contour';
export { PLACES } from './places';
export { CONTOURS } from './contours';

// --- Score ---
export const MAX_ROUND_POINTS = 1000;
export const MAX_DIRECTION_POINTS = 500;
export const MAX_DISTANCE_POINTS = 500;
// Bonus for the player(s) closest in the round (1/5 of their category's max), in
// multiplayer only: no one to beat in solo.
export const BEST_BONUS_RATIO = 0.2;
// Bonus for guessing the exact heading (to the nearest degree), on top of MAX_DIRECTION_POINTS.
export const EXACT_DIRECTION_BONUS = 100;
// Bonus for guessing the exact distance (to the nearest step the slider can actually reach at
// that magnitude, see `roundDistance`), on top of MAX_DISTANCE_POINTS.
export const EXACT_DISTANCE_BONUS = 100;

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
// Renamed from "fullazimut:*" along with the app itself (-> Azimuth Quiz, repo azimuth-quiz):
// deliberately resets every existing player's saved settings/theme/score/history/mascot-caught
// state on next launch, rather than keeping the old prefix forever for continuity.
export const BEST_SCORE_STORAGE_KEY = 'azimuthquiz:best-score';
export const SETTINGS_STORAGE_KEY = 'azimuthquiz:settings';
export const LANGUAGE_STORAGE_KEY = 'azimuthquiz:language';
export const THEME_STORAGE_KEY = 'azimuthquiz:theme';
/** Once the home screen's mascot (UFO by night, helicopter by day) is caught (clicked), it stops
 * moving forever. */
export const MASCOT_CAUGHT_STORAGE_KEY = 'azimuthquiz:ufo-caught';
/** How many times each Indices place has been drawn, across every game — lets rounds avoid
 * repeats (see helpers/indicesHistory.ts). */
export const INDICES_HISTORY_STORAGE_KEY = 'azimuthquiz:indices-history';
/** Home screen mascot roaming + starry/cloudy backdrop drift: off by default (some devices
 * stutter on them), opt-in via Settings. */
export const ANIMATIONS_ENABLED_STORAGE_KEY = 'azimuthquiz:animations-enabled';

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

/** Fallback first names for a name field left empty, rather than "Player 1", "Player 2"... Fixed
 * order — index 0 is always shown at the first field, etc. Used both as every setup screen's
 * cosmetic input placeholder and by playerDisplayName (stable identity for the whole game, chosen
 * by the same index). */
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

// Label/description: see translations.setup.categories / .difficulties (same id).
export const CATEGORIES: { id: Category; emoji: string }[] = [
  { id: 'cities', emoji: '🏙️' },
  // Star: the standard map symbol for a capital city.
  { id: 'capital', emoji: '⭐' },
  // Baguette rather than a flag emoji: flag glyphs are unreliable on some platforms (see
  // FLAG_FONT_FAMILY in themes/fonts.ts) and this chip doesn't warrant bundling that fix too.
  { id: 'citiesFr', emoji: '🥖' },
  { id: 'mountains', emoji: '⛰️' },
  { id: 'landmarks', emoji: '🏛️' },
  { id: 'nature', emoji: '🌿' },
  { id: 'kids', emoji: '🧒' },
];

export const DIFFICULTIES: { id: Difficulty; emoji: string }[] = [
  { id: 'easy', emoji: '🟢' },
  // Orange, not yellow (🟡): on Night's selected chip (its own amber accent background), a
  // yellow dot all but disappears. Day's accent is a true orange though, so there it's the
  // reverse — see `difficultyEmoji`, which swaps back to yellow for `intermediate` by day.
  { id: 'intermediate', emoji: '🟠' },
  { id: 'hard', emoji: '🔴' },
];

/** DIFFICULTIES' emoji, with the "moyen" dot swapped per-theme for readability against the
 * selected chip's own accent-colored background (see DIFFICULTIES' comment). */
export const difficultyEmoji = (difficulty: (typeof DIFFICULTIES)[number], isDark: boolean): string =>
  difficulty.id === 'intermediate' ? (isDark ? '🟠' : '🟡') : difficulty.emoji;

export const DEFAULT_SETTINGS: GameSettings = {
  playerNames: [''],
  categories: ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature'],
  // Single choice (radio).
  difficulties: ['intermediate'],
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
