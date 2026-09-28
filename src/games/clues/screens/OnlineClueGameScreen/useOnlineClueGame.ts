import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { bearingDeg, distanceKm, nameSkeleton } from '@/helpers';
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

import { onlineClueRoomPlayersFrom } from './helpers';

/**
 * All the online-clues business logic behind `OnlineClueGameScreen` — reads the shared
 * `roomStore` (never connects/disconnects it, see that store's own comment), owns this device's
 * draft guess text, and exposes already-resolved actions gated on "is it my turn"/"am I the
 * host". The container still computes the JSX-ready shapes (skeleton groups, labels...), same
 * split as Compass' own `useOnlineGame`/`OnlineGameScreen.tsx`.
 */
export const useOnlineClueGame = (code: string, onQuit: () => void) => {
  const router = useRouter();

  const localUid = useClueRoomStore((s) => s.localUid);
  const players = useClueRoomStore((s) => s.players);
  const hostUid = useClueRoomStore((s) => s.hostUid);
  const roomExists = useClueRoomStore((s) => s.roomExists);
  const roomSettings = useClueRoomStore((s) => s.roomSettings);
  const gameState = useClueRoomStore((s) => s.gameState);

  useEffect(() => {
    if (roomExists) return;
    const timeout = setTimeout(() => router.replace('/'), 2000);
    return () => clearTimeout(timeout);
  }, [roomExists, router]);

  const onlinePlayers = onlineClueRoomPlayersFrom(players);
  const isHost = localUid !== null && localUid === hostUid;
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

  // Host-only: once the turn-holder self-reports a correct guess, add the round's remaining score
  // to their running total — the only thing that ever writes `totalScores` (see `room.ts`'s own
  // comment on `applyClueRoomScore`). Guarded by a ref so a burst of snapshots can't fire this more
  // than once for the same round.
  const scoredRoundRef = useRef(-1);
  useEffect(() => {
    if (!isHost || gameState.verdict !== 'correct' || gameState.roundWinnerUid === null) return;
    if (scoredRoundRef.current === gameState.roundIndex) return;
    scoredRoundRef.current = gameState.roundIndex;
    const winnerUid = gameState.roundWinnerUid;
    const totalScores = {
      ...gameState.totalScores,
      [winnerUid]: (gameState.totalScores[winnerUid] ?? 0) + remaining,
    };
    applyClueRoomScore(code, totalScores).catch(() => {});
  }, [isHost, gameState.verdict, gameState.roundWinnerUid, gameState.roundIndex, gameState.totalScores, remaining, code]);

  // Host-only: mirrors the effect above for a miss — a fixed penalty (never the finder's
  // `remaining`-based reward), applied once per `wrongGuessSeq` advance rather than per round
  // (unlike a correct guess, a round can take several misses before it ends). `null` until this
  // effect has run once: catches up to whatever `wrongGuessSeq` the room is already at on mount
  // (a host reconnecting mid-game) without re-applying a penalty that already landed before.
  const lastAppliedWrongSeqRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isHost || gameState.wrongGuessUid === null) return;
    if (lastAppliedWrongSeqRef.current === null) {
      lastAppliedWrongSeqRef.current = gameState.wrongGuessSeq;
      return;
    }
    if (gameState.wrongGuessSeq <= lastAppliedWrongSeqRef.current) return;
    lastAppliedWrongSeqRef.current = gameState.wrongGuessSeq;
    const wrongUid = gameState.wrongGuessUid;
    const totalScores = {
      ...gameState.totalScores,
      [wrongUid]: (gameState.totalScores[wrongUid] ?? 0) - WRONG_ANSWER_PENALTY,
    };
    applyClueRoomScore(code, totalScores).catch(() => {});
  }, [isHost, gameState.wrongGuessUid, gameState.wrongGuessSeq, gameState.totalScores, code]);

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

  const handleQuit = () => {
    if (isHost) {
      deleteRoom(code).catch(() => {});
      useClueRoomStore.getState().disconnect();
      router.replace('/');
      return;
    }
    if (localUid !== null) {
      useClueRoomStore.getState().markVoluntaryLeave();
      removeRoomPlayer(code, localUid).catch(() => {});
    }
    onQuit();
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
