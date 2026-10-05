import type { ContourHintCategory, ContourRoundCountry } from '@/types';

import { CONTOUR_HINT_CATEGORIES, CONTOUR_HINT_POINTS_DROP, MAX_CONTOUR_POINTS } from '../constants';
import { FULL_PRECISION } from './simplify';

/** One hint the "Indice" button can reveal. The 3 `silhouette` steps make the outline more precise
 * (the coarse one is the starting point, level 0, when the category is on); the others put something
 * on the board; `reveal` is the last step of every plan: the country's flag and name, i.e. giving up. */
export type HintStep =
  | 'silhouette1'
  | 'silhouette2'
  | 'silhouette3'
  | 'neighborShapes'
  | 'neighborFlagFirst'
  | 'neighborFlags'
  | 'neighborCodes'
  | 'neighborNames'
  | 'cityPositions'
  | 'cityNames'
  | 'capitalPosition'
  | 'capitalName'
  | 'reveal';

const STEPS_BY_CATEGORY: Record<ContourHintCategory, HintStep[]> = {
  silhouette: ['silhouette1', 'silhouette2', 'silhouette3'],
  neighbors: ['neighborShapes', 'neighborFlagFirst', 'neighborFlags', 'neighborCodes', 'neighborNames'],
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
 * out: no neighbors, no cities or no capital in its document and the plan just
 * has fewer steps. `hintsRevealed` counts how many of these steps are out (0 to `plan.length`, the
 * last being `reveal`). Pure: every device rebuilds the very same plan from the room's categories and
 * the round's country, nothing more is stored per round.
 */
export const buildHintPlan = (categories: readonly ContourHintCategory[], country: ContourRoundCountry): HintStep[] => {
  const available: Record<ContourHintCategory, boolean> = {
    silhouette: true,
    neighbors: country.neighbors.length > 0,
    cities: country.cities.length > 0,
    capital: country.capital !== null,
  };
  const steps = ALL_CATEGORIES.filter((id) => categories.includes(id) && available[id]).flatMap(
    (id) => STEPS_BY_CATEGORY[id],
  );
  return [...steps, 'reveal'];
};

/** The three kinds of hints the players pick from (the outline, the neighbors, the cities and the capital), and the
 * final `reveal` of the country: each pick reveals the NEXT step of the group it is made in. */
export type HintGroup = 'silhouette' | 'neighbors' | 'cities' | 'reveal';

/** What a pick of the round can be: a group of the hint list, or the opening of a hidden cell of the board — a cell counts as
 * a hint (it takes one off the points and passes the turn) but reveals no step of the plan. */
export const QUADRANT_PICK = 'quadrant';
export type HintPick = HintGroup | typeof QUADRANT_PICK;

/** How many plan steps the picks brought out (the cell openings reveal none), and how many picks were cell openings. */
export const stepsOutOf = (picks: readonly HintPick[]): number => picks.filter((pick) => pick !== QUADRANT_PICK).length;
export const quadrantPicksOf = (picks: readonly HintPick[]): number => picks.length - stepsOutOf(picks);

/** The groups in the order the hint list shows them. */
export const HINT_GROUP_ORDER: readonly HintGroup[] = ['silhouette', 'neighbors', 'cities', 'reveal'];

const GROUP_OF: Record<HintStep, HintGroup> = {
  silhouette1: 'silhouette',
  silhouette2: 'silhouette',
  silhouette3: 'silhouette',
  neighborShapes: 'neighbors',
  neighborFlagFirst: 'neighbors',
  neighborFlags: 'neighbors',
  neighborCodes: 'neighbors',
  neighborNames: 'neighbors',
  cityPositions: 'cities',
  cityNames: 'cities',
  capitalPosition: 'cities',
  capitalName: 'cities',
  reveal: 'reveal',
};

/** The group a step belongs to. */
export const hintGroupOf = (step: HintStep): HintGroup => GROUP_OF[step];

/**
 * `plan` re-ordered by what the players picked: each pick (a group, in the order they were made) brings forward
 * the next step of that group not out yet, so the first `picks.length` steps of the result are the ones revealed
 * (`hintsRevealed` = `picks.length`) and everything downstream (labels, shape, points) keeps reading "the first N
 * steps". A group with no step left is ignored; the steps nobody picked follow in the plan's own order. A cell opening (`QUADRANT_PICK`) matches no group: it is ignored.
 */
export const orderHintPlan = (plan: readonly HintStep[], picks: readonly HintPick[]): HintStep[] => {
  const remaining = [...plan];
  const ordered: HintStep[] = [];
  for (const group of picks) {
    const index = remaining.findIndex((step) => GROUP_OF[step] === group);
    if (index !== -1) ordered.push(...remaining.splice(index, 1));
  }
  return [...ordered, ...remaining];
};

/** One group of the hint list: its steps (revealed or not) and the one a pick would reveal. */
export type HintGroupView = {
  group: HintGroup;
  steps: { step: HintStep; revealed: boolean }[];
  next: HintStep | undefined;
};

/**
 * The hint list for an (already ordered) `plan` with `hintsRevealed` steps out: only the groups the round has, and
 * the country itself (`reveal`) only once every other hint has been taken.
 */
export const hintGroupsView = (plan: readonly HintStep[], hintsRevealed: number): HintGroupView[] => {
  const groups = HINT_GROUP_ORDER.flatMap((group) => {
    const steps = plan
      .map((step, index) => ({ step, revealed: index < hintsRevealed }))
      .filter(({ step }) => GROUP_OF[step] === group);
    return steps.length === 0 ? [] : [{ group, steps, next: steps.find((entry) => !entry.revealed)?.step }];
  });
  const othersOut = groups.every((entry) => entry.group === 'reveal' || entry.next === undefined);
  return othersOut ? groups : groups.filter((entry) => entry.group !== 'reveal');
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

/**
 * What a correct guess earns with `stepsOut` plan steps out and `quadrantPicks` cells opened: a cell is one more hint
 * for the points, so the scale reads `stepsOut + quadrantPicks` — but only the country itself being revealed
 * (`stepsOut >= planLength`) takes it to 0: opening cells never brings it below the last step before the reveal.
 */
export const contourPoints = (stepsOut: number, quadrantPicks: number, planLength: number): number =>
  stepsOut >= planLength ? 0 : contourGuessPoints(Math.min(stepsOut + quadrantPicks, planLength - 1), planLength);
