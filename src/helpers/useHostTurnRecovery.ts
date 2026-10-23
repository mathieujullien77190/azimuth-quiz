import { reporting } from './reportError';
import { useEffect } from 'react';

import type { OnlinePlayer } from './roomPlayers';

/**
 * Hote seul : si le detenteur du tour quitte la room en pleine manche, `turnUid` pointe dans le vide ; l'hote passe
 * la main au 1er joueur present. Rien entre deux manches (`verdict`), avant le debut ou avant le chargement des joueurs.
 */
export const useHostTurnRecovery = (
  isHost: boolean,
  state: { screen: string; turnUid: string | null; verdict: 'correct' | 'giveUp' | null },
  players: OnlinePlayer[],
  passTurn: (uid: string) => Promise<void>,
) => {
  const { screen, turnUid, verdict } = state;
  const firstUid = players[0]?.uid;
  const turnHolderPresent = turnUid !== null && players.some((player) => player.uid === turnUid);

  useEffect(() => {
    if (!isHost || screen !== 'game' || verdict !== null || turnUid === null) return;
    if (firstUid === undefined || turnHolderPresent) return;
    passTurn(firstUid).catch(reporting('room.passTurn', { kind: 'background' }));
  }, [isHost, screen, verdict, turnUid, firstUid, turnHolderPresent, passTurn]);
};
