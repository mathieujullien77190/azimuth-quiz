import { DEFAULT_ORIGIN } from '@/data';
import type { Category, GameSettings } from '@/types';

// --- Score ---
export const MAX_DIRECTION_POINTS = 500;
export const MAX_DISTANCE_POINTS = 500;
// Bonus pour le(s) plus proche(s) de la manche (1/5 du max de la categorie), en multijoueur seulement.
export const BEST_BONUS_RATIO = 0.2;
// Bonus du cap exact (au degre pres), en plus de MAX_DIRECTION_POINTS.
export const EXACT_DIRECTION_BONUS = 100;
// Bonus de la distance exacte (au pas atteignable par le curseur, voir `roundDistance`), en plus de
// MAX_DISTANCE_POINTS.
export const EXACT_DISTANCE_BONUS = 100;

// Direction : 0 point a partir de cet ecart (degres).
export const DIRECTION_TOLERANCE_DEG = 90;
// Distance : 0 point quand l'estimation est a ce facteur pres (trop grande ou trop petite).
export const DISTANCE_TOLERANCE_RATIO = 4;
// Courbe de decroissance (>1 = plus raide pres de la bonne reponse).
export const SCORE_CURVE_EXPONENT = 1.5;

// --- Geography ---
export const MIN_DISTANCE_KM = 10;
/**
 * Plus grande distance de surface a estimer. Tenir le meme cap est plus long que la moitie de la
 * circonference : le pire trajet fait ~21 180 km, le curseur doit donc aller un peu au-dela.
 */
export const MAX_SURFACE_DISTANCE_KM = 22000;
// Reperes sous les curseurs de distance (echelle logarithmique).
export const DISTANCE_MARKS_KM = [100, 1000, 10000] as const;
export const DEFAULT_DISTANCE_KM = 1000;

// --- Storage ---
export const BEST_SCORE_STORAGE_KEY = 'azimuthquiz:best-score';
export const SETTINGS_STORAGE_KEY = 'azimuthquiz:settings';
/** Position de l'appareil dans chaque groupe de lieux (voir `helpers/cursors.ts`). */
export const CURSORS_STORAGE_KEY = 'azimuthquiz:compass-cursors';

// Libelle/description : voir translations.setup.categories (meme id).
export const CATEGORIES: { id: Category; emoji: string }[] = [
  { id: 'cities', emoji: '🏙️' },
  // Etoile : symbole de carte d'une capitale.
  { id: 'capital', emoji: '⭐' },
  // Baguette plutot qu'un drapeau : les emojis drapeaux sont peu fiables (voir FLAG_FONT_FAMILY dans
  // themes/fonts.ts).
  { id: 'citiesFr', emoji: '🥖' },
  { id: 'mountains', emoji: '⛰️' },
  { id: 'landmarks', emoji: '🏛️' },
  { id: 'nature', emoji: '🌿' },
  { id: 'kids', emoji: '🧒' },
];

export const DEFAULT_SETTINGS: GameSettings = {
  playerName: '',
  categories: ['cities', 'capital', 'citiesFr', 'mountains', 'landmarks', 'nature'],
  // Choix unique (radio).
  difficulty: 'intermediate',
  rounds: 5,
  useGps: true,
  // Paris par defaut, comme DEFAULT_ORIGIN (voir @/data).
  customLatitude: DEFAULT_ORIGIN.coordinates.latitude,
  customLongitude: DEFAULT_ORIGIN.coordinates.longitude,
  showCountry: false,
  travel: false,
};
