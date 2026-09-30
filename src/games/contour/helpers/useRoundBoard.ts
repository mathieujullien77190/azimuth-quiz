import { useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

import { spacing } from '@/data';
import type { ContourCountry, ContourRoundCountry } from '@/types';

import { projectRound, roundGeometry } from './roundBoard';

/** A stable empty list: the default of `neighborCountries` must not be a new array at every render. */
const NO_NEIGHBORS: readonly ContourCountry[] = [];

/** Fallback box for the very first render, before the board area's own `onLayout` has measured
 * anything real yet — just needs to be a sane placeholder for one frame, not a sizing heuristic:
 * the real box is measured live and can be bigger or smaller depending on the surrounding chrome
 * and screen size. */
const INITIAL_BOARD_MAX_SIZE = 280;
/** Shaved off every side of the board area's own measured size before fitting the board into it:
 * small and deliberate, just enough that the board's own bordered frame reads as floating a little
 * inside the screen instead of touching its edges — the point of measuring the full screen in the
 * first place was maximizing size, so this stays minimal. */
const BOARD_AREA_MARGIN = spacing.sm;

/**
 * Fits `country` to the live measured size of a full-bleed board area (`onBoardAreaLayout`, on the
 * View that fills the safe area) and hands back its `RoundBoard`. The translucent header/footer
 * bands that float on top of that board (`onOverlayTopLayout`/`onOverlayBottomLayout`) are
 * subtracted from the height budget the board is fit into, so a tall/narrow country (e.g. Portugal)
 * doesn't fit itself edge-to-edge past those bands and end up with its top/bottom hidden
 * underneath them — pass `fullBleed: false` (overlays don't apply) to skip that subtraction.
 * Shared by the local game and the online one.
 */
export const useRoundBoard = (
  country: ContourRoundCountry,
  fullBleed: boolean,
  simplifySeed = 0,
  neighborCountries: readonly ContourCountry[] = NO_NEIGHBORS,
) => {
  // The board area's live measured size — `null` for the one frame before its first `onLayout`
  // fires, so `board` falls back to a sane placeholder box.
  const [boardAreaSize, setBoardAreaSize] = useState<{ width: number; height: number } | null>(null);
  const onBoardAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardAreaSize((previous) =>
      previous?.width === width && previous?.height === height ? previous : { width, height },
    );
  };

  const [overlayTopHeight, setOverlayTopHeight] = useState(0);
  const [overlayBottomHeight, setOverlayBottomHeight] = useState(0);
  const onOverlayTopLayout = (event: LayoutChangeEvent) => setOverlayTopHeight(event.nativeEvent.layout.height);
  const onOverlayBottomLayout = (event: LayoutChangeEvent) => setOverlayBottomHeight(event.nativeEvent.layout.height);

  // Neighbors, coast/border split and the simplified rings only depend on the country and the
  // round's seed: computed once per round, not on every re-fit of the box.
  const geometry = useMemo(
    () => roundGeometry(country, simplifySeed, neighborCountries),
    [country, simplifySeed, neighborCountries],
  );

  // Re-fit (not re-roll) `country` to the live measured box: recomputes whenever the country
  // changes or the box itself does. Shaved by `BOARD_AREA_MARGIN` on every side first.
  const board = useMemo(
    () =>
      projectRound(
        country,
        (boardAreaSize?.width ?? INITIAL_BOARD_MAX_SIZE) - BOARD_AREA_MARGIN * 2,
        (boardAreaSize?.height ?? INITIAL_BOARD_MAX_SIZE) -
          BOARD_AREA_MARGIN * 2 -
          (fullBleed ? overlayTopHeight + overlayBottomHeight : 0),
        geometry,
      ),
    [country, geometry, boardAreaSize, fullBleed, overlayTopHeight, overlayBottomHeight],
  );

  return { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout };
};
