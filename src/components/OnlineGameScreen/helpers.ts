import { ROOM_PLAYER_COLORS } from '@/constants';
import type { RoomPlayers } from '@/helpers/room';
import type { Guess, Place, PlayerResult, RoundRecord, RoundScore } from '@/types';

import { ZERO_SCORE } from './constants';
import type { OnlinePlayer } from './types';

/** Stable player order for a room: arrival order (same as the setup screen's connected-players
 * list), so scores/needles/results index consistently across every device without agreeing on
 * anything beyond what's already in Firestore. Falls back to the first palette color for the
 * brief moment before the host's own color-sync effect has assigned a real one (see
 * SetupScreen). */
export const onlinePlayersFrom = (players: RoomPlayers): OnlinePlayer[] =>
  Object.entries(players)
    .sort(([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity))
    .map(([uid, player]) => ({ uid, name: player.name, color: player.color ?? ROOM_PLAYER_COLORS[0] }));

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
    const guess = guesses[uid] ?? { bearing: 0, distanceKm: 0, inclination: 0 };
    const score = scores[uid] ?? ZERO_SCORE;
    return { guess, score };
  }),
});
