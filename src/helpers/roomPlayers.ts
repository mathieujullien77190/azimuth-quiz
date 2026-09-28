import { ROOM_PLAYER_COLORS } from '@/data';

import type { RoomPlayer, RoomPlayers } from './roomBase';

// Type-only import of `roomBase`: erased at compile time, so this stays free of `firebase/firestore`
// at runtime (see `roomBase.ts`'s own note) — safe for any screen or test to import.

/** One connected player, in the stable arrival order used everywhere in an online game screen
 * (scores, turn order, results...) — built once from the room's `players` map. */
export type OnlinePlayer = {
  uid: string;
  name: string;
  color: string;
};

/** Connected players in arrival order. A brand-new entry reads back as `joinedAt: null` on the
 * device that just wrote it, until its `serverTimestamp()` round-trips — sorted last (its real
 * arrival slot), not first, so a joiner never briefly jumps to the top of its own list. */
export const playersByArrival = (players: RoomPlayers): [string, RoomPlayer][] =>
  Object.entries(players).sort(
    ([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity),
  );

/** Stable player order for a room: arrival order (same as the setup screen's connected-players
 * list), so scores/turns/results index consistently across every device without agreeing on
 * anything beyond what's already in Firestore. Falls back to the first palette color for the
 * brief moment before the host's own color-sync effect has assigned a real one. */
export const onlinePlayersFrom = (players: RoomPlayers): OnlinePlayer[] =>
  playersByArrival(players).map(([uid, player]) => ({
    uid,
    name: player.name,
    color: player.color ?? ROOM_PLAYER_COLORS[0],
  }));
