import { DEFAULT_ORIGIN } from '@/data';
import type { Category, GameSettings } from '@/types';

// --- Score ---
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
export const MIN_DISTANCE_KM = 10;
/** Largest surface distance to estimate. Holding the same heading all the way (see `helpers/geo`) is longer than
 * half the Earth's circumference: the longest such route is about 21 180 km (two places a world apart, one far
 * north and the other as far south), so the slider must go a bit beyond that. */
export const MAX_SURFACE_DISTANCE_KM = 22000;
// Marks shown below the distance sliders (logarithmic scale).
export const DISTANCE_MARKS_KM = [100, 1000, 10000] as const;
export const DEFAULT_DISTANCE_KM = 1000;

// --- Storage ---
export const BEST_SCORE_STORAGE_KEY = 'azimuthquiz:best-score';
export const SETTINGS_STORAGE_KEY = 'azimuthquiz:settings';
/** Where the device is in each Compass group, to take the next places (see `helpers/compassCursors.ts`). */
export const COMPASS_CURSORS_STORAGE_KEY = 'azimuthquiz:compass-cursors';

// Label/description: see translations.setup.categories (same id).
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

export const DEFAULT_SETTINGS: GameSettings = {
  playerName: '',
  categories: ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature'],
  // Single choice (radio).
  difficulty: 'intermediate',
  rounds: 5,
  useGps: true,
  // Paris by default, like DEFAULT_ORIGIN (see @/data).
  customLatitude: DEFAULT_ORIGIN.coordinates.latitude,
  customLongitude: DEFAULT_ORIGIN.coordinates.longitude,
  liveCompass: false,
  showCountry: false,
  travel: false,
};
