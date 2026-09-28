import { useEffect } from 'react';

import type { RoomPlayers } from './roomBase';

/** The per-player maps a game keeps in its round state (each game has some of them, none has all). */
const PLAYER_KEYED_FIELDS = ['guesses', 'scores', 'totalScores'] as const;

/** Round data each field still holds for players who aren't in the room any more, by field. */
export type StaleRoomData = Record<string, string[]>;

/**
 * Host-only clean-up: when a player leaves (quits, is kicked...), whatever they left in the round data —
 * their guess, their score, their running total — goes with them. Coming back, they are a brand-new
 * player: no points, no answer, last in the arrival order. Only the host can erase other players'
 * entries, and every device sees the same room, so it is the host that does it, whichever way the
 * player left.
 *
 * Waits until this device knows who it is *and* is listed among the players: before that the players
 * list can be empty for a moment, which would read as "everybody left".
 */
export const useHostPruneLeavers = (
  isHost: boolean,
  localUid: string | null,
  players: RoomPlayers,
  gameState: unknown,
  prune: (stale: StaleRoomData) => Promise<void>,
) => {
  useEffect(() => {
    if (!isHost || localUid === null || !(localUid in players)) return;
    const state = gameState as Partial<Record<(typeof PLAYER_KEYED_FIELDS)[number], Record<string, unknown> | null>>;
    const stale: StaleRoomData = {};
    for (const field of PLAYER_KEYED_FIELDS) {
      const uids = Object.keys(state[field] ?? {}).filter((uid) => !(uid in players));
      if (uids.length > 0) stale[field] = uids;
    }
    if (Object.keys(stale).length === 0) return;
    prune(stale).catch(() => {});
  }, [isHost, localUid, players, gameState, prune]);
};
