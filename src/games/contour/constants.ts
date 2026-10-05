import type { ContourHintCategory, ContourSettings } from '@/types';

/** Points a correct guess earns before any hint; each hint takes a share of it (see `contourGuessPoints`). */
export const MAX_CONTOUR_POINTS = 500;
/** Share of `MAX_CONTOUR_POINTS` lost between the first and the last hint of a round's plan. */
export const CONTOUR_HINT_POINTS_DROP = 0.85;

/** The kinds of hints a round can use (all of them by default), in the fixed order their steps come in a
 * round (see `buildHintPlan`). */
export const CONTOUR_HINT_CATEGORIES: { id: ContourHintCategory; emoji: string }[] = [
  { id: 'silhouette', emoji: '🗺️' },
  { id: 'neighbors', emoji: '🧩' },
  { id: 'cities', emoji: '🏙️' },
  { id: 'capital', emoji: '⭐' },
];

/** Where this device is in each Silhouette difficulty group, to take the next countries (see `helpers/contourCursors.ts`). */
export const CONTOUR_CURSORS_STORAGE_KEY = 'azimuthquiz:contour-cursors';

/** At most this many cities of a country are offered as hints (capital excluded). */
export const MAX_CITY_HINTS = 5;

// Flat penalty deducted from whichever player is attributed a wrong country guess (see
// ContourGameScreen's post-"Valider" attribution step) — same amount regardless of hint tier.
export const CONTOUR_WRONG_GUESS_PENALTY = 5;


export const DEFAULT_CONTOUR_SETTINGS: ContourSettings = {
  playerName: '',
  rounds: 5,
  difficulty: 'easy',
  hintCategories: CONTOUR_HINT_CATEGORIES.map((category) => category.id),
};
