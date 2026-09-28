import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { DEFAULT_DISTANCE_KM } from '@/games/compass/constants';
import { applyBestBonus, scoreRound } from '@/helpers';
import {
  deleteRoom,
  finishRoomRound,
  nextRoomRound,
  removeRoomPlayer,
  submitRoomGuess,
} from '@/games/compass/helpers/room';
import { useRoomStore } from '@/games/compass/store/roomStore';
import type { RoundRecord, RoundScore } from '@/types';

import { DEFAULT_BEARING } from './constants';
import { buildRoundRecord, onlinePlayersFrom } from './helpers';

/**
 * All the online-game business logic behind `OnlineGameScreen` — reads the shared `roomStore`
 * (never connects/disconnects it, see that store's own comment), owns this device's answer draft
 * and the locally-accumulated round history, and exposes already-resolved actions. The container
 * still computes the JSX-ready shapes (`earthMarks`, formatted labels...), same split as
 * `useGame`/`GameScreen.tsx`.
 */
export const useOnlineGame = (code: string, onQuit: () => void) => {
  const router = useRouter();

  const localUid = useRoomStore((s) => s.localUid);
  const players = useRoomStore((s) => s.players);
  const hostUid = useRoomStore((s) => s.hostUid);
  const roomExists = useRoomStore((s) => s.roomExists);
  const roomSettings = useRoomStore((s) => s.roomSettings);
  const gameState = useRoomStore((s) => s.gameState);

  // Once the room itself has disappeared (the host quit/deleted it — see `handleQuit` below),
  // every other device freezes on a "the host left" notice instead of carrying on with whatever
  // stale players/game state its last snapshot left behind — straight to the home screen, not
  // just "back" (SetupScreen would still show this same, now-gone room).
  useEffect(() => {
    if (roomExists) return;
    const timeout = setTimeout(() => router.replace('/'), 2000);
    return () => clearTimeout(timeout);
  }, [roomExists, router]);

  const onlinePlayers = onlinePlayersFrom(players);
  const isHost = localUid !== null && localUid === hostUid;
  const place = gameState.places[gameState.roundIndex];

  // This device's own in-progress answer — reset at the top of every round. Adjusted during
  // render rather than in an effect (React's own recommended pattern for "reset state when a
  // value changes": https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // — an effect here would mean an extra, avoidable render pass on every round change.
  const [bearing, setBearingState] = useState(DEFAULT_BEARING);
  const [distanceKm, setDistanceKmState] = useState(DEFAULT_DISTANCE_KM);
  const [bearingTouched, setBearingTouched] = useState(false);
  const [distanceTouched, setDistanceTouched] = useState(false);
  const [draftRoundIndex, setDraftRoundIndex] = useState(gameState.roundIndex);
  if (gameState.roundIndex !== draftRoundIndex) {
    setDraftRoundIndex(gameState.roundIndex);
    setBearingState(DEFAULT_BEARING);
    setDistanceKmState(DEFAULT_DISTANCE_KM);
    setBearingTouched(false);
    setDistanceTouched(false);
  }
  const setBearing = (value: number) => {
    setBearingState(value);
    setBearingTouched(true);
  };
  const setDistanceKm = (value: number) => {
    setDistanceKmState(value);
    setDistanceTouched(true);
  };

  // Every device accumulates the rounds it's actually seen revealed, in the exact shape
  // `RoundResult`/`EndScreen` expect — the room only ever keeps the *current* round's
  // guesses/scores, not a running history, so this is the only copy of it anywhere.
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const lastRecordedRoundRef = useRef(-1);
  useEffect(() => {
    const scores = gameState.scores;
    if (gameState.screen !== 'reveal' || scores === null || place === undefined) return;
    if (lastRecordedRoundRef.current === gameState.roundIndex) return;
    lastRecordedRoundRef.current = gameState.roundIndex;
    setRecords((previous) => [...previous, buildRoundRecord(place, onlinePlayers, gameState.guesses, scores)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.screen, gameState.scores, gameState.roundIndex, gameState.guesses, place]);

  // Host-only: once every connected player has answered, score the round (against the host's own
  // origin — see SetupScreen's `startOnlineGame`) and move everyone to the reveal screen. Guarded
  // by a ref (not state) so a burst of snapshots while `screen` is still 'game' can't fire this
  // more than once for the same round.
  const finishedRoundRef = useRef(-1);
  useEffect(() => {
    const origin = gameState.origin;
    if (!isHost || gameState.screen !== 'game' || origin === null || place === undefined) return;
    if (finishedRoundRef.current === gameState.roundIndex) return;
    if (onlinePlayers.length === 0) return;
    const allAnswered = onlinePlayers.every(({ uid }) => gameState.guesses[uid] !== undefined);
    if (!allAnswered) return;

    finishedRoundRef.current = gameState.roundIndex;
    const results = applyBestBonus(
      onlinePlayers.map(({ uid }) => {
        const guess = gameState.guesses[uid];
        return {
          guess,
          score: scoreRound(origin.coordinates, place, guess),
        };
      }),
    );
    const scores: Record<string, RoundScore> = {};
    const totalScores: Record<string, number> = {};
    onlinePlayers.forEach(({ uid }, index) => {
      scores[uid] = results[index].score;
      totalScores[uid] = (gameState.totalScores[uid] ?? 0) + results[index].score.total;
    });
    finishRoomRound(code, scores, totalScores).catch(() => {});
  }, [isHost, gameState, onlinePlayers, place, code]);

  // Keyed by uid (not derived from `records`' array position): the host writes this to the room
  // after every round (see `finishRoomRound`), so it survives a kick reshuffling `onlinePlayers`'
  // order/length mid-game, or a device joining late with no local `records` history of its own —
  // either of which used to desync a `records`-derived total from the real running score.
  const totals = onlinePlayers.map(({ uid }) => gameState.totalScores[uid] ?? 0);
  const myIndex = onlinePlayers.findIndex((p) => p.uid === localUid);

  // Host: quitting takes the whole room down with it (everyone else sees the room-deleted notice
  // above) — there's no "pass the host" concept here, and there's nothing left to go "back" to
  // (SetupScreen would still be sitting on this same, now-deleted room, since `push`ing to
  // `/online-game` never popped it off the stack), so home directly rather than `onQuit`. Also
  // disconnects the shared `roomStore` right here rather than leaving it to that same SetupScreen
  // instance's own connect/disconnect effect: that effect only reacts to its `connectedRoomCode`
  // changing, which it never will on its own (it's still sitting there, unchanged) — without this,
  // the store stays parked on the now-deleted room (stale `code`/`gameState.screen`), and its own
  // "go to `/online-game` once the host starts a round" effect fires again the next time that
  // stale screen re-renders, right back into a room that no longer exists. A joiner just drops its
  // own presence instead, so it doesn't keep blocking the round for everyone else while it's
  // answered by nobody — going back to SetupScreen still makes sense there, the room is still very
  // much alive.
  const handleQuit = () => {
    if (isHost) {
      deleteRoom(code).catch(() => {});
      useRoomStore.getState().disconnect();
      router.replace('/');
      return;
    }
    if (localUid !== null) {
      // Marked *before* the write goes out: SetupScreen's own "was I kicked?" listener reacts to
      // the same players update this produces, and can't otherwise tell "I just quit" apart from
      // "the host removed me" — both look identical in Firestore (present, then not).
      useRoomStore.getState().markVoluntaryLeave();
      removeRoomPlayer(code, localUid).catch(() => {});
    }
    onQuit();
  };

  const submit = async () => {
    if (localUid === null) return;
    const guess = { bearing, distanceKm };
    await submitRoomGuess(code, localUid, guess).catch(() => {});
  };

  // Host only: expels a player from the room mid-game — never yourself (nothing to hand the host
  // role to, see `handleQuit`'s own comment).
  const kickPlayer = isHost
    ? (index: number) => {
        const uid = onlinePlayers[index]?.uid;
        if (uid !== undefined && uid !== localUid) removeRoomPlayer(code, uid).catch(() => {});
      }
    : undefined;

  const goToNextRound = () => nextRoomRound(code, gameState.roundIndex + 1, gameState.places.length).catch(() => {});

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
    distanceKm,
    bearingTouched,
    distanceTouched,
    setBearing,
    setDistanceKm,
    records,
    totals,
    myIndex,
    handleQuit,
    submit,
    kickPlayer,
    goToNextRound,
  };
};
