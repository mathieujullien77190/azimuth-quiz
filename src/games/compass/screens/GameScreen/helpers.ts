import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { spacing } from '@/data';
import type { RoundRecord } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';

// How close to an edge (in px) a manual scroll counts as "reached the top"/"reached the
// bottom" — a little slack for momentum/bounce overshoot, not a hard pixel-perfect edge.
const SCROLL_EDGE_THRESHOLD_PX = 24;

/** Whether a scroll event lands the round on the cap (heading) section or the distance one —
 * `null` while still somewhere in between, meaning "leave whichever the button already shows".
 * Shared by `GameScreen`/`OnlineGameScreen`: both sync `FooterNav`'s label to the actual scroll
 * position (a manual drag), not just to the button's own last press. */
export const onCapFromScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): boolean | null => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  if (contentOffset.y <= SCROLL_EDGE_THRESHOLD_PX) return false;
  if (contentOffset.y + layoutMeasurement.height >= contentSize.height - SCROLL_EDGE_THRESHOLD_PX) return true;
  return null;
};

/** Each player's point total, in player order. */
export const playerTotals = (records: RoundRecord[], playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, playerIndex) =>
    records.reduce((total, record) => total + (record.results[playerIndex]?.score.total ?? 0), 0),
  );

/** Tab order (and who plays first) for a round: pure rotation starting from player
 * `roundIndex % playerCount`, so everyone takes turns going first across rounds — not
 * a sort by score, which would always put the same player(s) at the front. */
export const rotatedOrder = (roundIndex: number, playerCount: number): number[] =>
  Array.from({ length: playerCount }, (_, i) => (roundIndex + i) % playerCount);

// On the very first render of the static web export, `useWindowDimensions` can return 0 (a
// value frozen at server render, never corrected without a real resize): without a safeguard,
// the compass and Earth would end up with a negative size, so invisible. We fall back to their
// max size instead of letting them disappear.
export const compassSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_COMPASS_SIZE, windowWidth - spacing.lg * 2);
  return size > 0 ? size : MAX_COMPASS_SIZE;
};

export const earthSizeFor = (windowWidth: number): number => {
  const size = Math.min(MAX_EARTH_SIZE, windowWidth - spacing.lg * 2 - spacing.md * 2);
  return size > 0 ? size : MAX_EARTH_SIZE;
};
