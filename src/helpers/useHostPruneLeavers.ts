import { reporting } from './reportError';
import { useEffect } from 'react';

import type { RoomPlayers } from '../firebase/roomApi';

/** Maps par joueur de l'etat de manche (chaque jeu en a certaines, aucun toutes). */
const PLAYER_KEYED_FIELDS = ['guesses', 'scores', 'totalScores'] as const;

/** Donnees de manche encore presentes par champ pour des joueurs partis. */
export type StaleRoomData = Record<string, string[]>;

/**
 * Hote seul : quand un joueur part, ses donnees de manche (reponse, score, total) partent avec lui ; s'il revient,
 * c'est un nouveau joueur. Attend de se connaitre dans la liste : avant, elle peut etre vide et lire "tous partis".
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
    prune(stale).catch(reporting('room.pruneLeavers', { kind: 'background' }));
  }, [isHost, localUid, players, gameState, prune]);
};
