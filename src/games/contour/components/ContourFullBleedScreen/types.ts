import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import type { RoundBoard } from '@/games/contour/helpers/roundBoard';

import type { ContourBoardHintLabel } from '../ContourBoard';

export type ContourFullBleedScreenProps = {
  /** From `useRoundBoard`: the country's board, fit to the measured area. */
  board: RoundBoard;
  /** Precision level of the outline, 0 (a handful of segments) to 3 (the full ring, with the
   * neighbors around it) — see `boardShapeFor`. Defaults to the full ring. */
  precision?: number;
  hintLabels: ContourBoardHintLabel[];
  /** Remounts the board on every round (its own internal state, if any, starts fresh). */
  roundKey: number;
  onBoardAreaLayout: (event: LayoutChangeEvent) => void;
  onOverlayTopLayout: (event: LayoutChangeEvent) => void;
  onOverlayBottomLayout: (event: LayoutChangeEvent) => void;
  /** Floats over the top of the board (a `GameHeader`). */
  header: ReactNode;
  /** Floats over the bottom of the board (the answer input, or the round result) — pass a
   * `GameFooter` for the panel look. */
  footer: ReactNode;
  /** Anything that should cover the whole screen on top of everything else (an overlay). */
  children?: ReactNode;
};
