import { ROOM_PLAYER_COLORS } from '@/data';

import type { RoomPlayer, RoomPlayers } from '../firebase/room';

// Import de type seul : efface a la compilation, donc sans `firebase/firestore` a l'execution.

/** Un joueur connecte, dans l'ordre d'arrivee stable, construit depuis la map `players` de la room. */
export type OnlinePlayer = {
  uid: string;
  name: string;
  color: string;
};

/** Joueurs connectes en ordre d'arrivee. Une entree toute neuve vaut `joinedAt: null` tant que `serverTimestamp()`
 * n'est pas revenu : triee en dernier pour ne pas sauter en tete. */
export const playersByArrival = (players: RoomPlayers): [string, RoomPlayer][] =>
  Object.entries(players).sort(
    ([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity),
  );

/** Ordre stable des joueurs (arrivee, comme le salon) pour indexer scores/tours sur tous les appareils.
 * Premiere couleur de la palette tant que l'hote n'a pas attribue la vraie. */
export const onlinePlayersFrom = (players: RoomPlayers): OnlinePlayer[] =>
  playersByArrival(players).map(([uid, player]) => ({
    uid,
    name: player.name,
    color: player.color ?? ROOM_PLAYER_COLORS[0],
  }));

// Hors `roomBase.ts` (qui importe `firebase/firestore`, inutilisable dans un test Jest ou un hook pur).

/** `code` de l'erreur de `joinRoomPresence` quand le nom est deja pris. */
const NAME_TAKEN_CODE = 'name-taken';

export const nameTakenError = (): Error =>
  Object.assign(new Error('That name is already taken in this room.'), { code: NAME_TAKEN_CODE });

export const isNameTakenError = (error: unknown): boolean =>
  error instanceof Error && (error as Error & { code?: string }).code === NAME_TAKEN_CODE;

const normalized = (name: string): string => name.trim().toLowerCase();

/** Un autre joueur a-t-il deja ce nom (casse et espaces autour ignores) ? `uid` = soi, jamais compte. */
export const isNameTaken = (name: string, players: RoomPlayers, uid: string): boolean =>
  Object.entries(players).some(
    ([otherUid, player]) => otherUid !== uid && normalized(player.name) === normalized(name),
  );

/** Premier de `placeholders` libre, pour qui n'a pas tape de nom (`uid` = soi, ignore) ; le premier si tous pris. */
export const freePlaceholder = (placeholders: readonly string[], players: RoomPlayers, uid: string | null): string =>
  placeholders.find((placeholder) => !isNameTaken(placeholder, players, uid ?? '')) ?? placeholders[0];
