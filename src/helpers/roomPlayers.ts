import { ROOM_PLAYER_COLORS } from '@/data';

import type { RoomPlayer, RoomPlayers } from '../firebase/roomApi';

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
