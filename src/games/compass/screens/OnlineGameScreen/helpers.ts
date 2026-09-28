import type { OnlinePlayer } from '@/helpers/roomPlayers';
import type { Guess, Place, PlayerResult, RoundRecord, RoundScore } from '@/types';

import { ZERO_SCORE } from './constants';

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
