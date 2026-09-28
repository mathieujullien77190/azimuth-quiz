import { CONTOURS } from '@/data';
import { countryName, flagEmoji } from '@/data/places/countries';
import type { Language } from '@/i18n';
import type { ContourCountry, ContourNeighbor, Point2D } from '@/types';

import {
  BOARD_PADDING_RATIO,
  HINT_STACK_GAP_RATIO,
  boardDimensionsFor,
  createProjector,
  projectPoints,
  type ContourBoardHintLabel,
} from '../components/ContourBoard';
import { CONTOUR_MAX_HINTS } from '../constants';
import { computeBorders, type CountryBorders } from './borders';
import { neighborIcon, neighborName } from './contourCountry';
import { FULL_PRECISION, simplificationLevels } from './simplify';

/** Hint tiers 1-3 only make the outline more precise; the first label tier is the next one. */
const PRECISION_HINTS = FULL_PRECISION;

/** Board data for a round's country, fit to a `maxWidth`/`maxHeight` box: re-derived (not
 * re-rolled) whenever the box changes, so the same round reflows to fill whatever space is
 * actually available (device rotation, ...) instead of picking a new country. */
export type RoundBoard = {
  country: ContourCountry;
  /** Canvas size, shaped to the country's own aspect ratio (see `boardDimensionsFor`) rather
   * than a fixed square — as large as it can be within `maxWidth`/`maxHeight` without distorting it. */
  width: number;
  height: number;
  /** The country's full outline, projected once for the round — shown as-is from the very start
   * of the guess phase. */
  outline: Point2D[];
  /** The outline at each precision level 0 to 3 (`simplificationLevels`), projected in the same frame
   * as `outline` (the frame is the full ring's, so the shape never moves or rescales as it gets
   * more precise); the last one is `outline` itself. */
  precisionOutlines: Point2D[][];
  /** Rings of the countries that touch the target (see `computeBorders`), projected in the same
   * frame: only there to fill the space around the silhouette, never stroked. */
  neighborOutlines: Point2D[][];
  /** Stretches of the outline that touch no neighbor: the only ones stroked with the heavy coast line. */
  coastlines: Point2D[][];
  /** Stretches of the outline shared with a neighbor: stroked once, thinner. */
  borders: Point2D[][];
  /** Tier 2/4's own on-board anchor for the target country's own flag, then its name stacked just
   * below it (see `HINT_STACK_GAP_RATIO`) — curated per country (`ContourCountry.centerLabel`,
   * a fraction of this canvas, same model as `ContourNeighbor`), rather than a fixed geometric
   * center: lets an oddly-shaped country (or an admin, via the Contour view) place it somewhere
   * that actually reads well over the silhouette. */
  centerPosition: Point2D;
  /** Every curated neighbor (see `ContourCountry.neighbors`), paired with its on-board pixel
   * position (`neighbor.x`/`y` scaled to this round's canvas). */
  neighborHints: { neighbor: ContourNeighbor; position: Point2D }[];
};

/** What only depends on the country (and the round's seed), not on the box: callers that re-fit the
 * same country several times (`useRoundBoard`) compute it once and pass it in. */
export type RoundGeometry = {
  /** Which neighbors to draw and where the outline is coast or border (`computeBorders`). */
  borders: CountryBorders;
  /** The nested simplified rings, level 0 to 3 (`simplificationLevels`). */
  rings: (readonly (readonly [number, number])[])[];
};

/** `RoundGeometry` of a country for a round's seed; the borders come from the whole game dataset. */
export const roundGeometry = (country: ContourCountry, simplifySeed: number): RoundGeometry => ({
  borders: computeBorders(country, CONTOURS),
  rings: simplificationLevels(country.points, simplifySeed),
});

export const projectRound = (
  country: ContourCountry,
  maxWidth: number,
  maxHeight: number,
  geometry: RoundGeometry = roundGeometry(country, 0),
): RoundBoard => {
  const { borders, rings } = geometry;
  const { width, height } = boardDimensionsFor(country.points, maxWidth, maxHeight);
  // Ratio of Math.min(width, height), not a fixed pixel count — see BOARD_PADDING_RATIO's own doc
  // comment for why: keeps the admin's differently-sized preview canvas laid out proportionally
  // identical to this board.
  const project = createProjector(country.points, { width, height }, Math.min(width, height) * BOARD_PADDING_RATIO);

  return {
    country,
    width,
    height,
    outline: projectPoints(country.points, project),
    precisionOutlines: rings.map((ring) => projectPoints(ring, project)),
    neighborOutlines: borders.neighborRings.map((ring) => projectPoints(ring, project)),
    coastlines: borders.coastRuns.map((run) => projectPoints(run, project)),
    borders: borders.borderRuns.map((run) => projectPoints(run, project)),
    centerPosition: { x: country.centerLabel.x * width, y: country.centerLabel.y * height },
    // `neighbor.x`/`y` are already a fraction of this exact board canvas (see `ContourNeighbor`'s
    // own doc comment) — just scale, no reprojection or edge-clamping needed.
    neighborHints: country.neighbors.map((neighbor) => ({
      neighbor,
      position: { x: neighbor.x * width, y: neighbor.y * height },
    })),
  };
};

/** What is drawn on the board at `hintsRevealed` tiers: the outline's precision level and, past it,
 * the neighbors (which only appear once the outline is the full ring, see `borders.ts`). */
export const precisionLevel = (hintsRevealed: number): number => Math.min(hintsRevealed, PRECISION_HINTS);

/** The shape props `ContourBoard` gets at a precision level: below the full ring only the simplified
 * outline, as one single stroke and with no neighbors (their shared edges only line up on the full
 * ring); at the full ring, the neighbors as a backdrop and coast/borders drawn once. */
export const boardShapeFor = (board: RoundBoard, level: number) =>
  level < FULL_PRECISION
    ? { outline: board.precisionOutlines[level] }
    : {
        outline: board.outline,
        neighborOutlines: board.neighborOutlines,
        coastlines: board.coastlines,
        borders: board.borders,
      };

/** The 7 hint tiers. 1-3 refine the outline itself (see `boardShapeFor`); the labels are all drawn
 * straight on the board: tier 4 shows every neighbor's flag at its own curated spot, tier 5 adds the
 * target country's own flag at its curated spot, tier 6 stacks each neighbor's name just below its
 * own icon (not swapped — both stay up so the icon keeps reading as "this is what that name refers
 * to"), tier 7 stacks the country's name below its flag the same way (effectively the answer). */
export const buildHintLabels = (
  board: RoundBoard,
  hintsRevealed: number,
  language: Language,
): ContourBoardHintLabel[] => {
  const stackGap = Math.min(board.width, board.height) * HINT_STACK_GAP_RATIO;
  const neighborLabels: ContourBoardHintLabel[] =
    hintsRevealed >= PRECISION_HINTS + 1
      ? board.neighborHints.flatMap(({ neighbor, position }) => [
          { position, icon: true, text: neighborIcon(neighbor) },
          ...(hintsRevealed >= PRECISION_HINTS + 3
            ? [{ position: { x: position.x, y: position.y + stackGap }, text: neighborName(neighbor, language) }]
            : []),
        ])
      : [];
  const centerLabels: ContourBoardHintLabel[] = [
    ...(hintsRevealed >= PRECISION_HINTS + 2
      ? [{ position: board.centerPosition, icon: true, text: flagEmoji(board.country.code) }]
      : []),
    ...(hintsRevealed >= CONTOUR_MAX_HINTS
      ? [
          {
            position: { x: board.centerPosition.x, y: board.centerPosition.y + stackGap },
            text: countryName(board.country.code, language),
          },
        ]
      : []),
  ];
  return [...neighborLabels, ...centerLabels];
};
