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
import { neighborIcon, neighborName } from './contourCountry';

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

export const projectRound = (country: ContourCountry, maxWidth: number, maxHeight: number): RoundBoard => {
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
    centerPosition: { x: country.centerLabel.x * width, y: country.centerLabel.y * height },
    // `neighbor.x`/`y` are already a fraction of this exact board canvas (see `ContourNeighbor`'s
    // own doc comment) — just scale, no reprojection or edge-clamping needed.
    neighborHints: country.neighbors.map((neighbor) => ({
      neighbor,
      position: { x: neighbor.x * width, y: neighbor.y * height },
    })),
  };
};

/** The 4 hint tiers, all drawn straight on the board: tier 1 shows every neighbor's flag at its
 * own curated spot, tier 2 adds the target country's own flag at its curated spot, tier 3 stacks
 * each neighbor's name just below its own icon (not swapped — both stay up so the icon keeps
 * reading as "this is what that name refers to"), tier 4 stacks the country's name below its flag
 * the same way (effectively the answer). */
export const buildHintLabels = (
  board: RoundBoard,
  hintsRevealed: number,
  language: Language,
): ContourBoardHintLabel[] => {
  const stackGap = Math.min(board.width, board.height) * HINT_STACK_GAP_RATIO;
  const neighborLabels: ContourBoardHintLabel[] =
    hintsRevealed >= 1
      ? board.neighborHints.flatMap(({ neighbor, position }) => [
          { position, icon: true, text: neighborIcon(neighbor) },
          ...(hintsRevealed >= 3
            ? [{ position: { x: position.x, y: position.y + stackGap }, text: neighborName(neighbor, language) }]
            : []),
        ])
      : [];
  const centerLabels: ContourBoardHintLabel[] = [
    ...(hintsRevealed >= 2
      ? [{ position: board.centerPosition, icon: true, text: flagEmoji(board.country.code) }]
      : []),
    ...(hintsRevealed >= 4
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
