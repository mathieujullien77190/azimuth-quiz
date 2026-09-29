import { useCallback, useEffect, useRef, useState } from 'react';

import { bearingDeg, distanceKm, nameSkeleton } from '@/helpers';
import { useDebouncedValue } from '@/helpers/useDebouncedValue';
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
  pruneRoomPlayerData,
  removeRoomPlayer,
  reportClueRoomCorrect,
  reportClueRoomWrong,
  setClueRoomTyping,
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
    useOnlineRoomSession(useClueRoomStore, { deleteRoom, removeRoomPlayer, pruneRoomPlayerData }, code, onQuit);

  const place = gameState.places[gameState.roundIndex];
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;

  // This device's own in-progress guess text.
  const { guessText, setGuessText } = useGuessDraft(gameState.roundIndex, gameState.turnUid);

  // Who just missed, for everyone to see (not just the guesser — `wrongGuessUid`/`wrongGuessSeq`
  // are room-wide). `wrongGuessSeq` only ever increases, never reset between rounds (the host's own
  // scoring effect relies on that to never re-apply a penalty, see `useHostTurnScoring`), so a
  // baseline captured once per round (the "reset state when a prop changes" pattern, see
  // `useGuessDraft`'s own comment) tells a miss that actually happened this round apart from one
  // carried over from an earlier one. Still `turnUid`-gated too (same idiom as `typedByActivePlayer`
  // below): a miss stops being "current" the moment its own player's turn ends (they pick another
  // clue), same as it used to disappear from the guesser's own screen before this was shared.
  const [wrongSeqRoundIndex, setWrongSeqRoundIndex] = useState(gameState.roundIndex);
  const [wrongSeqAtRoundStart, setWrongSeqAtRoundStart] = useState(gameState.wrongGuessSeq);
  if (wrongSeqRoundIndex !== gameState.roundIndex) {
    setWrongSeqRoundIndex(gameState.roundIndex);
    setWrongSeqAtRoundStart(gameState.wrongGuessSeq);
  }
  const wrongGuesserName =
    gameState.wrongGuessUid !== null &&
    gameState.wrongGuessUid === gameState.turnUid &&
    gameState.wrongGuessSeq > wrongSeqAtRoundStart
      ? (onlinePlayers.find((player) => player.uid === gameState.wrongGuessUid)?.name ?? null)
      : null;

  // Mirrors this device's own guess text to the room, ~500ms after it stops changing, so the other
  // players can watch the turn-holder type it live (`typing` in `ClueRoomGameState`). Solo (nobody
  // else could see it) and spectators (never this device's own turn) never write; a round already
  // over stops writing too. `lastWrittenRef` skips a write when the debounced value hasn't actually
  // changed since the last one that went out (the effect would otherwise still fire on unrelated
  // re-renders with the same debounced value).
  const debouncedGuessText = useDebouncedValue(guessText, 500);
  // Starts at '' (not null): an untouched field has nothing to show anyone, so the very first
  // render must not fire a write of its own just because nothing has been sent yet.
  const lastWrittenTypingRef = useRef('');
  useEffect(() => {
    if (!isMyTurn || localUid === null || gameState.verdict !== null || onlinePlayers.length <= 1) return;
    if (lastWrittenTypingRef.current === debouncedGuessText) return;
    lastWrittenTypingRef.current = debouncedGuessText;
    setClueRoomTyping(code, localUid, debouncedGuessText).catch(() => {});
  }, [debouncedGuessText, isMyTurn, localUid, gameState.verdict, onlinePlayers.length, code]);

  // Only meaningful for a spectator watching the current turn-holder, mid-round: `typing.uid` is
  // checked against `turnUid` because it is never reset by itself on a turn/round change, so a
  // value left over from the previous turn-holder must not leak into the new one's.
  const typedByActivePlayer =
    !isMyTurn && gameState.verdict === null && gameState.typing !== null && gameState.typing.uid === gameState.turnUid
      ? gameState.typing.text
      : '';

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

  // `place` is briefly undefined while the room's data is still loading (the screen shows the
  // loading splash then, see OnlineClueGameScreen.tsx) — 0 is never actually shown to a player.
  const remaining = place !== undefined ? remainingScore(gameState.revealedClueIds, place) : 0;

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
    setGuessText('');
  };

  // Host-only, whoever's turn it is: cuts the round short rather than let it drag on. The Firestore
  // rules let the host write any field (`isHost()`, ahead of `turnBasedPlayer`'s own turn-holder
  // check), so no rule change is needed for this to work off the host's own turn too.
  const giveUp = () => {
    if (!isHost) return;
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
    typedByActivePlayer,
    skeletonGroups,
    skeletonLengthKnown,
    remaining,
    guessText,
    setGuessText,
    wrongGuesserName,
    pickClue,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
  };
};
