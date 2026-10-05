import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { HintStep } from '@/games/contour/helpers/hintPlan';
import type { RoundBoard } from '@/games/contour/helpers/roundBoard';

import type { ContourBoardHintLabel } from '../ContourBoard';

export type ContourFullBleedScreenProps = {
  /** From `useRoundBoard`: the country's board, fit to the measured area. */
  board: RoundBoard;
  /** The round's hint steps (`buildHintPlan`) and how many of them are out: they set the outline's
   * precision and whether the neighbors are drawn — see `boardShapeFor`. */
  plan: HintStep[];
  hintsRevealed: number;
  hintLabels: ContourBoardHintLabel[];
  /** Remounts the board on every round (its own internal state, if any, starts fresh). */
  roundKey: number;
  onBoardAreaLayout: (event: LayoutChangeEvent) => void;
  onOverlayTopLayout: (event: LayoutChangeEvent) => void;
  onOverlayBottomLayout: (event: LayoutChangeEvent) => void;
  /** Drawn over the board, in its exact rectangle and above everything on it (the hidden cells of Silhouette's quadrants,
   * see `ContourQuadrantMask`). */
  boardOverlay?: ReactNode;
  /** Floats over the top of the board (a `GameHeader`). */
  header: ReactNode;
  /** Floats over the bottom of the board (the answer input, or the round result) — pass a
   * `GameFooter` for the panel look. */
  footer: ReactNode;
  /** Anything that should cover the whole screen on top of everything else (an overlay). */
  children?: ReactNode;
};
