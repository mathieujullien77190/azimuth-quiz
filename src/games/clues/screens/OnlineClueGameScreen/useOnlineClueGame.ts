import { useCallback, useState } from 'react';

import { bearingDeg, distanceKm, nameSkeleton } from '@/helpers';
import { useHostTurnScoring } from '@/helpers/useHostTurnScoring';
import { useOnlineRoomSession } from '@/helpers/useOnlineRoomSession';
import {
  applyClueRoomScore,
  deleteRoom,
  giveUpClueRoom,
  nextClueRoomRound,
  pickClueRoomClue,
  removeRoomPlayer,
  reportClueRoomCorrect,
  reportClueRoomWrong,
} from '@/games/clues/helpers/room';
import { WRONG_ANSWER_PENALTY } from '@/games/clues/screens/ClueGameScreen/constants';
import { normalizePlaceGuess, remainingScore } from '@/games/clues/screens/ClueGameScreen/helpers';
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
  const { localUid, players, roomExists, roomSettings, gameState, onlinePlayers, isHost, handleQuit } =
    useOnlineRoomSession(useClueRoomStore, { deleteRoom, removeRoomPlayer }, code, onQuit);

  const place = gameState.places[gameState.roundIndex];
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;

  // This device's own in-progress guess text, and the "you got it wrong" banner — reset whenever
  // the round or the turn-holder changes, same "reset state during render" pattern as
  // `useOnlineGame`'s own draft answer (an effect here would mean an extra, avoidable render).
  const [guessText, setGuessTextState] = useState('');
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [draftKey, setDraftKey] = useState(`${gameState.roundIndex}:${gameState.turnUid ?? ''}`);
  const currentKey = `${gameState.roundIndex}:${gameState.turnUid ?? ''}`;
  if (currentKey !== draftKey) {
    setDraftKey(currentKey);
    setGuessTextState('');
    setLastWrong(null);
  }

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

  const pickClue = (clueId: ClueId) => {
    if (!isMyTurn || localUid === null) return;
    const myIndex = onlinePlayers.findIndex((p) => p.uid === localUid);
    const nextTurnUid = onlinePlayers[(myIndex + 1) % onlinePlayers.length]?.uid;
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
    setGuessTextState('');
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
    roomExists,
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
    setGuessText: setGuessTextState,
    lastWrong,
    pickClue,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
  };
};
