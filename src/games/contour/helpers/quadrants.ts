import type { ContourRoundCountry, Point2D } from '@/types';

// Straight from the files, not from `../components/ContourBoard`: that folder's `index.ts` brings the React Native board
// along, and this module is also used by the admin (a plain web app), which only needs the geometry.
import { BOARD_PADDING_RATIO } from '../components/ContourBoard/constants';
import { boardDimensionsFor, createProjector, projectPoints } from '../components/ContourBoard/helpers';

/** The board (the country's fitted rectangle) is cut in 2 x 2 equal cells: 0 top-left, 1 top-right, 2 bottom-left,
 * 3 bottom-right. */
export const QUADRANT_COUNT = 4;

/** A cell of the grid, in pixels of the board it cuts. */
export type QuadrantRect = { index: number; x: number; y: number; width: number; height: number };

/** The four cells of a `width` x `height` board, in cell order. */
export const quadrantRects = (width: number, height: number): QuadrantRect[] =>
  Array.from({ length: QUADRANT_COUNT }, (_, index) => ({
    index,
    x: (index % 2) * (width / 2),
    y: Math.floor(index / 2) * (height / 2),
    width: width / 2,
    height: height / 2,
  }));

/** The two lines that cut a `width` x `height` board in four, as `[x1, y1, x2, y2]` (the board's own frame aside): the
 * game covers the cells with masks, the admin preview only draws these (see `ContourQuadrantGrid`). */
export const quadrantGridLines = (
  width: number,
  height: number,
): { vertical: [number, number, number, number]; horizontal: [number, number, number, number] } => ({
  vertical: [width / 2, 0, width / 2, height],
  horizontal: [0, height / 2, width, height / 2],
});

/** Which cell a point (as a share 0-1 of the board's width and height) falls in. */
const quadrantOf = (x: number, y: number): number => (x >= 0.5 ? 1 : 0) + (y >= 0.5 ? 2 : 0);

/** Edges are walked in this many steps, so a long straight border still marks every cell it crosses. */
const EDGE_STEPS = 8;
/** The side of the square the country is fitted to, to find where it lies: any size would do, as only shares of it are
 * kept — what matters is that it is the same on every device (the screen's own measured box is not). */
const REFERENCE_SIZE = 1000;

/** All a country needs here is its outline. */
type Outlined = Pick<ContourRoundCountry, 'points'>;

/** The cells the country's outline goes through (so never an empty one), in cell order. Worked out in a fixed
 * reference frame, not the device's own board: every device gets the same answer. */
export const occupiedQuadrants = (country: Outlined): number[] => {
  const { width, height } = boardDimensionsFor(country.points, REFERENCE_SIZE, REFERENCE_SIZE);
  const project = createProjector(country.points, { width, height }, Math.min(width, height) * BOARD_PADDING_RATIO);
  const outline: Point2D[] = projectPoints(country.points, project);
  const occupied = new Set<number>();
  outline.forEach((from, index) => {
    const to = outline[(index + 1) % outline.length];
    for (let step = 0; step < EDGE_STEPS; step += 1) {
      const share = step / EDGE_STEPS;
      occupied.add(
        quadrantOf((from.x + (to.x - from.x) * share) / width, (from.y + (to.y - from.y) * share) / height),
      );
    }
  });
  return [...occupied].sort((a, b) => a - b);
};

/** The one cell that is open at the start of a round: picked from the cells the country is in, by the round's seed
 * (`roundSimplifySeed`), so every device opens the same one. */
export const startQuadrant = (country: Outlined, seed: number): number => {
  const candidates = occupiedQuadrants(country);
  return candidates[seed % candidates.length];
};

/** The cells still hidden, given the starting one and the ones revealed since. */
export const hiddenQuadrants = (start: number, revealed: readonly number[]): number[] =>
  Array.from({ length: QUADRANT_COUNT }, (_, index) => index).filter(
    (index) => index !== start && !revealed.includes(index),
  );

/** A box on the board, in pixels (a flag, say). */
type Box = { x: number; y: number; width: number; height: number };

/** The boxes whose centre lies in a hidden cell of a `width` x `height` board: what the mask marks, since the cell
 * covers it. A box in an open cell is left alone. */
export const markersInHiddenQuadrants = (
  boxes: readonly Box[],
  width: number,
  height: number,
  hidden: readonly number[],
): Box[] => {
  const cells = quadrantRects(width, height).filter((rect) => hidden.includes(rect.index));
  return boxes.filter((box) => {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    return cells.some((cell) => x >= cell.x && x < cell.x + cell.width && y >= cell.y && y < cell.y + cell.height);
  });
};
