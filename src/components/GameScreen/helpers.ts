import { spacing } from '@/constants';
import type { RoundRecord } from '@/types';

import { MAX_COMPASS_SIZE, MAX_EARTH_SIZE } from './constants';

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
