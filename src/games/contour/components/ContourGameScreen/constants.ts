import { spacing } from '@/constants';

/** Fallback box for the very first render, before the board area's own `onLayout` has measured
 * anything real yet (see `ContourGameScreen`'s `boardAreaSize`) — just needs to be a sane
 * placeholder for one frame, not a sizing heuristic: the real box is measured live and can be
 * bigger or smaller depending on the surrounding chrome (guess vs city phase) and screen size. */
export const INITIAL_BOARD_MAX_SIZE = 280;
/** Shaved off every side of the board area's own measured size (see `boardAreaSize`) before
 * fitting the board into it: small and deliberate, just enough that the board's own bordered
 * frame reads as floating a little inside the screen instead of touching its edges — the point
 * of measuring the full screen in the first place was maximizing size, so this stays minimal. */
export const BOARD_AREA_MARGIN = spacing.sm;
