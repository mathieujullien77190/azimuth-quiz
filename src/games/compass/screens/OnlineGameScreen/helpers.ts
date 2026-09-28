import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { spacing } from '@/data';
import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { Guess, Place, PlayerResult, RoundRecord, RoundScore } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE, ZERO_SCORE } from './constants';

/** Assembles a round's `RoundRecord` (place + one result per player, in `onlinePlayers` order)
 * from the room's raw `guesses`/`scores` maps — the shape `RoundResult`/`EndScreen` expect,
 * built the same way for every device instead of trusting the host to distribute it directly. */
export const buildRoundRecord = (
  place: Place,
  onlinePlayers: OnlinePlayer[],
  guesses: Record<string, Guess>,
  scores: Record<string, RoundScore>,
): RoundRecord => ({
  place,
  results: onlinePlayers.map(({ uid }): PlayerResult => {
    const guess = guesses[uid] ?? { bearing: 0, distanceKm: 0 };
    const score = scores[uid] ?? ZERO_SCORE;
    return { guess, score };
  }),
});

// How close to an edge (in px) a manual scroll counts as "reached the top"/"reached the
// bottom" — a little slack for momentum/bounce overshoot, not a hard pixel-perfect edge.
const SCROLL_EDGE_THRESHOLD_PX = 24;

/** Whether a scroll event lands the round on the cap (heading) section or the distance one —
 * `null` while still somewhere in between, meaning "leave whichever the button already shows".
 * Syncs `FooterNav`'s label to the actual scroll
 * position (a manual drag), not just to the button's own last press. */
export const onCapFromScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): boolean | null => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  if (contentOffset.y <= SCROLL_EDGE_THRESHOLD_PX) return false;
  if (contentOffset.y + layoutMeasurement.height >= contentSize.height - SCROLL_EDGE_THRESHOLD_PX) return true;
  return null;
};

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
