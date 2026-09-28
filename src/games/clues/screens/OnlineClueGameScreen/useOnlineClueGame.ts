import { useCallback } from 'react';

import { bearingDeg, distanceKm, nameSkeleton } from '@/helpers';
import { nextPlayerUid } from '@/helpers/roomPlayers';
import { useGuessDraft } from '@/helpers/useGuessDraft';
import { useHostTurnRecovery } from '@/helpers/useHostTurnRecovery';
import { useHostTurnScoring } from '@/helpers/useHostTurnScoring';
import { useOnlineRoomSession } from '@/helpers/useOnlineRoomSession';
import {
  applyClueRoomScore,
  deleteRoom,
  giveUpClueRoom,
  nextClueRoomRound,
  passRoomTurn,
  pickClueRoomClue,
  removeRoomPlayer,
  reportClueRoomCorrect,
  reportClueRoomWrong,
} from '@/games/clues/helpers/room';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/constants';
import { normalizePlaceGuess, remainingScore } from '@/games/clues/helpers/clueGame';
import { useClueRoomStore } from '@/games/clues/store/roomStore';
import type { ClueId } from '@/types';

/**
 * All the online-clues business logic behind `OnlineClueGameScreen` — the room session (state,
 * host, players, quit) is the shared `useOnlineRoomSession`; this owns this device's draft guess
 * text and exposes already-resolved actions gated on "is it my turn"/"am I the host". The container
 * still computes the JSX-ready shapes (skeleton groups, labels...), same split as Compass' own
 * `useOnlineGame`/`OnlineGameScreen.tsx`.
 */
export const useOnlineClueGame = (code: string, onQuit: () => void) => {
  const { localUid, players, connectionLost, connected, roomSettings, gameState, onlinePlayers, isHost, handleQuit } =
    useOnlineRoomSession(useClueRoomStore, { deleteRoom, removeRoomPlayer }, code, onQuit);

  const place = gameState.places[gameState.roundIndex];
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;

  // This device's own in-progress guess text, and the "you got it wrong" banner.
  const { guessText, setGuessText, lastWrong, setLastWrong } = useGuessDraft(gameState.roundIndex, gameState.turnUid);

  const originReady = gameState.origin !== null && place !== undefined;
  const bearing = originReady ? bearingDeg(gameState.origin!.coordinates, place!.coordinates) : 0;
  const distance = originReady ? distanceKm(gameState.origin!.coordinates, place!.coordinates) : 0;

  const letterStage = gameState.revealedClueIds.filter((id) => id === 'letter').length;
  const vowelsRevealed = gameState.revealedClueIds.includes('vowels');
  const skeletonLengthKnown = letterStage >= 2 || vowelsRevealed;
  const skeletonGroups =
    place !== undefined && letterStage >= 1
      ? nameSkeleton(place.name, {
          groupByWord: letterStage >= 2 || vowelsRevealed,
          lengthKnown: skeletonLengthKnown,
          revealVowels: vowelsRevealed,
        })
      : [];

  const remaining = remainingScore(gameState.revealedClueIds);

  // Host-only: the turn-holder only ever self-reports a find/miss, this is the only thing that
  // writes `totalScores` (see `room.ts`'s own comment on `applyClueRoomScore`).
  const applyScore = useCallback(
    (totalScores: Record<string, number>) => applyClueRoomScore(code, totalScores),
    [code],
  );
  useHostTurnScoring(isHost, gameState, remaining, WRONG_ANSWER_PENALTY, applyScore);
  const passTurn = useCallback((uid: string) => passRoomTurn(code, uid), [code]);
  useHostTurnRecovery(isHost, gameState, onlinePlayers, passTurn);

  const pickClue = (clueId: ClueId) => {
    if (!isMyTurn || localUid === null) return;
    const nextTurnUid = nextPlayerUid(onlinePlayers, localUid);
    if (nextTurnUid === undefined) return;
    pickClueRoomClue(code, [...gameState.revealedClueIds, clueId], nextTurnUid).catch(() => {});
  };

  const submitGuess = () => {
    if (!isMyTurn || localUid === null || place === undefined) return;
    const correct = normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name);
    if (correct) {
      reportClueRoomCorrect(code, localUid).catch(() => {});
      return;
    }
    reportClueRoomWrong(code, localUid, gameState.wrongGuessSeq + 1).catch(() => {});
    setLastWrong(onlinePlayers.find((p) => p.uid === localUid)?.name ?? '');
    setGuessText('');
  };

  const giveUp = () => {
    if (!isMyTurn) return;
    giveUpClueRoom(code).catch(() => {});
  };

  const goToNextRound = () => {
    if (!isHost) return;
    const firstTurnUid = onlinePlayers[0]?.uid;
    if (firstTurnUid === undefined) return;
    nextClueRoomRound(
      code,
      gameState.roundIndex + 1,
      gameState.places.length,
      firstTurnUid,
      roomSettings?.startWithFirstLetter ?? false,
    ).catch(() => {});
  };

  return {
    localUid,
    players,
    onlinePlayers,
    isHost,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    place,
    bearing,
    distance,
    isMyTurn,
    skeletonGroups,
    skeletonLengthKnown,
    remaining,
    guessText,
    setGuessText,
    lastWrong,
    pickClue,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
  };
};
