export type ContourQuadrantMaskProps = {
  /** The board it covers, in pixels: the same size as the country's board. */
  width: number;
  height: number;
  /** The cells still hidden (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right): every other one is left clear. */
  hidden: readonly number[];
  /** Whether a hidden cell can be tapped to open it (the turn-holder, while the round is on). */
  canReveal: boolean;
  /** What opening a cell costs, as text ("−61 pts": the points one more hint takes off), shown on a cell that can be tapped. */
  costLabel: string;
  /** The accessibility label of a hidden cell that can be tapped. */
  labelFor: (index: number) => string;
  /** The boxes of the flags on the board (pixels): one lying behind a hidden cell is marked above it, since the cell
   * hides it. Optional: nothing is marked without them. */
  flagBoxes?: readonly { x: number; y: number; width: number; height: number }[];
  /** The cell the player tapped. */
  onReveal: (index: number) => void;
};
