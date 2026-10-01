import type { Language } from '@/i18n';
import type { ContourCountry, ContourNamedNeighbor, ContourRoundCountry, Point2D } from '@/types';

import { flagEmoji } from '@/helpers/flagEmoji';

import {
  BOARD_PADDING_RATIO,
  HINT_STACK_GAP_RATIO,
  boardDimensionsFor,
  createProjector,
  projectPoints,
  type ContourBoardHintLabel,
} from '../components/ContourBoard';
import { computeBorders, type CountryBorders } from './borders';
import { neighborIcon, neighborName, roundCountryName } from './contourCountry';
import { revealedSteps, silhouetteLevel, type HintStep } from './hintPlan';
import { FULL_PRECISION, simplificationLevels } from './simplify';

/** Marker of the capital, then of the other cities, on the board: the capital gets a star (bigger, like
 * a flag), a city a plain dot — a position is what these hints give, and the name comes on the next step. */
const CAPITAL_MARKER = '⭐';
const CITY_MARKER = '●';

/** A place on the board: its name and where it is, in pixels. */
export type BoardMark = { name: string; position: Point2D };

/** Board data for a round's country, fit to a `maxWidth`/`maxHeight` box: re-derived (not
 * re-rolled) whenever the box changes, so the same round reflows to fill whatever space is
 * actually available (device rotation, ...) instead of picking a new country. */
export type RoundBoard = {
  country: ContourRoundCountry;
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
  /** The neighbors' own outlines minus the edges they share with the target (see `computeBorders`): the
   * dashed lines around the silhouette. */
  neighborBorders: Point2D[][];
  /** The country's cities offered as hints (capital excluded, from the country's document), projected with
   * the very same projector as the outline. */
  cityMarks: BoardMark[];
  /** Same for the capital, `null` for a country without one in the data. */
  capitalMark: BoardMark | null;
  /** The `reveal` step's own on-board anchor for the target country's own flag, then its name stacked just
   * below it (see `HINT_STACK_GAP_RATIO`) — curated per country (`ContourCountry.centerLabel`,
   * a fraction of this canvas, same model as `ContourNeighbor`), rather than a fixed geometric
   * center: lets an oddly-shaped country (or an admin, via the Contour view) place it somewhere
   * that actually reads well over the silhouette. */
  centerPosition: Point2D;
  /** Every curated neighbor (see `ContourCountry.neighbors`), paired with its on-board pixel
   * position (`neighbor.x`/`y` scaled to this round's canvas). */
  neighborHints: { neighbor: ContourNamedNeighbor; position: Point2D }[];
};

/** What only depends on the country (and the round's seed), not on the box: callers that re-fit the
 * same country several times (`useRoundBoard`) compute it once and pass it in. */
export type RoundGeometry = {
  /** Which neighbors to draw and where the outline is coast or border (`computeBorders`). */
  borders: CountryBorders;
  /** The nested simplified rings, level 0 to 3 (`simplificationLevels`). */
  rings: (readonly (readonly [number, number])[])[];
};

/** `RoundGeometry` of a country for a round's seed; the borders come from the rings of the countries around it
 * (`RoundData.neighborCountries`, read with the round). */
export const roundGeometry = (
  country: ContourCountry,
  simplifySeed: number,
  neighborCountries: readonly ContourCountry[] = [],
): RoundGeometry => ({
  borders: computeBorders(country, neighborCountries),
  rings: simplificationLevels(country.points, simplifySeed),
});

export const projectRound = (
  country: ContourRoundCountry,
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
    neighborBorders: borders.neighborRuns.map((run) => projectPoints(run, project)),
    cityMarks: country.cities.map((city) => ({ name: city.name, position: project([city.longitude, city.latitude]) })),
    capitalMark: country.capital
      ? { name: country.capital.name, position: project([country.capital.longitude, country.capital.latitude]) }
      : null,
    centerPosition: { x: country.centerLabel.x * width, y: country.centerLabel.y * height },
    // `neighbor.x`/`y` are already a fraction of this exact board canvas (see `ContourNeighbor`'s
    // own doc comment) — just scale, no reprojection or edge-clamping needed.
    neighborHints: country.neighbors.map((neighbor) => ({
      neighbor,
      position: { x: neighbor.x * width, y: neighbor.y * height },
    })),
  };
};

/** The shape props `ContourBoard` gets after `hintsRevealed` steps of `plan`. The neighbors are never filled: the
 * `neighborShapes` step adds the borders the country shares with them (thin) and the rest of their outlines
 * (dashed), at their full precision. Below the full ring (the silhouette hints): the outline at its current precision
 * level, as one single stroke — with those lines once their step is out (the players pick the order: they can come
 * while the outline is still coarse). On the full ring: the outline alone until the `neighborShapes` step, then the
 * coast and those lines (the shared edges only line up on the full ring, see `borders.ts`, hence no coast/border
 * split below it). */
export const boardShapeFor = (board: RoundBoard, plan: readonly HintStep[], hintsRevealed: number) => {
  const level = silhouetteLevel(plan, hintsRevealed);
  const neighborsOut = revealedSteps(plan, hintsRevealed).has('neighborShapes');
  if (level < FULL_PRECISION) {
    return neighborsOut
      ? { outline: board.precisionOutlines[level], borders: board.borders, neighborBorders: board.neighborBorders }
      : { outline: board.precisionOutlines[level] };
  }
  if (!neighborsOut) return { outline: board.outline };
  return {
    outline: board.outline,
    coastlines: board.coastlines,
    borders: board.borders,
    neighborBorders: board.neighborBorders,
  };
};

/** The labels of the steps out after `hintsRevealed` steps of `plan`, all drawn straight on the
 * board. Neighbors: every flag at its own curated spot, then each country code and, one step later, its full name, stacked just below its icon
 * (both stay up so the icon keeps reading as "this is what that name refers to"). Cities and capital:
 * a marker at the place's position, then its name stacked below. `reveal`: the country's own flag at
 * its curated spot with its name below (effectively the answer). */
export const buildHintLabels = (
  board: RoundBoard,
  plan: readonly HintStep[],
  hintsRevealed: number,
  language: Language,
): ContourBoardHintLabel[] => {
  const out = revealedSteps(plan, hintsRevealed);
  const stackGap = Math.min(board.width, board.height) * HINT_STACK_GAP_RATIO;
  const below = (position: Point2D): Point2D => ({ x: position.x, y: position.y + stackGap });

  const neighborLabels = board.neighborHints.flatMap(({ neighbor, position }) => [
    ...(out.has('neighborFlags') ? [{ position, icon: true, text: neighborIcon(neighbor) }] : []),
    // Under the flag: first the country code ("IT"), then — the next step — the full name in its place.
    ...(out.has('neighborNames')
      ? [{ position: below(position), text: neighborName(neighbor, language) }]
      : out.has('neighborCodes')
        ? [{ position: below(position), text: neighbor.code }]
        : []),
  ]);
  const cityLabels = board.cityMarks.flatMap(({ name, position }) => [
    ...(out.has('cityPositions') ? [{ position, text: CITY_MARKER }] : []),
    ...(out.has('cityNames') ? [{ position: below(position), text: name }] : []),
  ]);
  const capitalLabels: ContourBoardHintLabel[] = board.capitalMark
    ? [
        ...(out.has('capitalPosition')
          ? [{ position: board.capitalMark.position, icon: true, text: CAPITAL_MARKER }]
          : []),
        ...(out.has('capitalName')
          ? [{ position: below(board.capitalMark.position), text: board.capitalMark.name }]
          : []),
      ]
    : [];
  const revealLabels: ContourBoardHintLabel[] = out.has('reveal')
    ? [
        { position: board.centerPosition, icon: true, text: flagEmoji(board.country.code) },
        { position: below(board.centerPosition), text: roundCountryName(board.country, language) },
      ]
    : [];
  return [...neighborLabels, ...cityLabels, ...capitalLabels, ...revealLabels];
};
