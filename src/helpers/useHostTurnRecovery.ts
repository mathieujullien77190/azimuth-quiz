import { reporting } from './reportError';
import { useEffect } from 'react';

import type { OnlinePlayer } from './roomPlayers';

/**
 * Host-only safety net for a turn-based online game: if the player holding the turn leaves the room
 * mid-round (a joiner quitting — the host quitting deletes the room outright, see
 * `useOnlineRoomSession`), `turnUid` would point at someone who no longer exists and nobody could
 * play. The host hands the turn to the first player still there instead. Does nothing between
 * rounds (`verdict` set: the next round resets the turn anyway), before the game starts, or while
 * the players list hasn't loaded yet.
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
