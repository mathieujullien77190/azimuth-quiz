import type { ContourCountry, ContourHintCategory } from '@/types';

import { CONTOUR_HINT_CATEGORIES, CONTOUR_HINT_POINTS_DROP, MAX_CONTOUR_POINTS } from '../constants';
import { contourPlacesFor, type ContourPlaces } from './contourPlaces';
import { FULL_PRECISION } from './simplify';

/** One hint the "Indice" button can reveal. The 3 `silhouette` steps make the outline more precise
 * (the coarse one is the starting point, level 0, when the category is on); the others put something
 * on the board; `reveal` is the last step of every plan: the country's flag and name, i.e. giving up. */
export type HintStep =
  | 'silhouette1'
  | 'silhouette2'
  | 'silhouette3'
  | 'neighborShapes'
  | 'neighborFlags'
  | 'neighborNames'
  | 'cityPositions'
  | 'cityNames'
  | 'capitalPosition'
  | 'capitalName'
  | 'reveal';

const STEPS_BY_CATEGORY: Record<ContourHintCategory, HintStep[]> = {
  silhouette: ['silhouette1', 'silhouette2', 'silhouette3'],
  neighbors: ['neighborShapes', 'neighborFlags', 'neighborNames'],
  cities: ['cityPositions', 'cityNames'],
  capital: ['capitalPosition', 'capitalName'],
};

const ALL_CATEGORIES = CONTOUR_HINT_CATEGORIES.map((category) => category.id);

/**
 * The hint categories of a room, whatever it carries: only known ids, each once, in the fixed order
 * of the plan; nothing usable (an old room or setting without the field, an empty list) means all of them.
 */
export const normalizeHintCategories = (raw: unknown): ContourHintCategory[] => {
  const picked = Array.isArray(raw) ? ALL_CATEGORIES.filter((id) => raw.includes(id)) : [];
  return picked.length > 0 ? picked : ALL_CATEGORIES;
};

/**
 * The ordered steps of a round's hints: the steps of each chosen category, in the fixed order
 * silhouette, neighbors, cities, capital — then `reveal`. A step the country cannot offer is left
 * out: no neighbors, no cities or no capital in the data (see `contourPlacesFor`) and the plan just
 * has fewer steps. `hintsRevealed` counts how many of these steps are out (0 to `plan.length`, the
 * last being `reveal`). Pure: every device rebuilds the very same plan from the room's categories and
 * the round's country, nothing more is stored per round.
 */
export const buildHintPlan = (
  categories: readonly ContourHintCategory[],
  country: ContourCountry,
  places: ContourPlaces = contourPlacesFor(country),
): HintStep[] => {
  const available: Record<ContourHintCategory, boolean> = {
    silhouette: true,
    neighbors: country.neighbors.length > 0,
    cities: places.cities.length > 0,
    capital: places.capital !== null,
  };
  const steps = ALL_CATEGORIES.filter((id) => categories.includes(id) && available[id]).flatMap(
    (id) => STEPS_BY_CATEGORY[id],
  );
  return [...steps, 'reveal'];
};

/** The steps out once `hintsRevealed` of them have been revealed. */
export const revealedSteps = (plan: readonly HintStep[], hintsRevealed: number): ReadonlySet<HintStep> =>
  new Set(plan.slice(0, hintsRevealed));

/** Precision level (0-3, see `simplificationLevels`) of the outline at `hintsRevealed`: level 0 to
 * start with when the silhouette hints are on, one more per silhouette step; the full ring right away
 * when they are off. */
export const silhouetteLevel = (plan: readonly HintStep[], hintsRevealed: number): number =>
  plan.includes('silhouette1')
    ? plan.slice(0, hintsRevealed).filter((step) => step.startsWith('silhouette')).length
    : FULL_PRECISION;

/** What a correct guess earns with `hintsRevealed` steps of a `planLength`-step plan out: 500 down to
 * 15 % of it, evenly, over the steps before `reveal`; nothing once the country itself is revealed. */
export const contourGuessPoints = (hintsRevealed: number, planLength: number): number => {
  if (hintsRevealed >= planLength) return 0;
  if (planLength === 1) return MAX_CONTOUR_POINTS;
  return Math.round(MAX_CONTOUR_POINTS * (1 - (CONTOUR_HINT_POINTS_DROP * hintsRevealed) / (planLength - 1)));
};
