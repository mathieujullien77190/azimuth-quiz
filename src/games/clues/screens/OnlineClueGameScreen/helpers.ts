import { CLUE_ROOM_PLAYER_COLORS } from '@/games/clues/constants';
import type { ClueRoomPlayers } from '@/games/clues/helpers/room';

import type { OnlineCluePlayer } from './types';

/** Stable player order for a room: arrival order (same as the setup screen's connected-players
 * list, and the same order `turnUid` cycles through) — mirrors Compass' own `onlinePlayersFrom`.
 * Falls back to the first palette color for the brief moment before the host's own color-sync
 * effect has assigned a real one. */
export const onlineClueRoomPlayersFrom = (players: ClueRoomPlayers): OnlineCluePlayer[] =>
  Object.entries(players)
    .sort(([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity))
    .map(([uid, player]) => ({ uid, name: player.name, color: player.color ?? CLUE_ROOM_PLAYER_COLORS[0] }));
