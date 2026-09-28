import { useCallback, useMemo } from 'react';

import { CONTOURS } from '@/data';
import { countryName } from '@/data/places/countries';
import { CONTOUR_WRONG_GUESS_PENALTY } from '@/games/contour/constants';
import {
  applyContourRoomScore,
  deleteRoom,
  giveUpContourRoom,
  nextContourRoomRound,
  passRoomTurn,
  pruneRoomPlayerData,
  removeRoomPlayer,
  reportContourRoomCorrect,
  reportContourRoomWrong,
  revealContourRoomHint,
} from '@/games/contour/helpers/room';
import { normalizeContourGuess } from '@/games/contour/helpers/contourCountry';
import { buildHintPlan, contourGuessPoints, normalizeHintCategories } from '@/games/contour/helpers/hintPlan';
import { roundSimplifySeed } from '@/games/contour/helpers/simplify';
import { useContourRoomStore } from '@/games/contour/store/roomStore';
import { nextPlayerUid } from '@/helpers/roomPlayers';
import { useGuessDraft } from '@/helpers/useGuessDraft';
import { useHostTurnRecovery } from '@/helpers/useHostTurnRecovery';
import { useHostTurnScoring } from '@/helpers/useHostTurnScoring';
import { useOnlineRoomSession } from '@/helpers/useOnlineRoomSession';
import { useLanguage } from '@/i18n';

/**
 * All the online-Silhouette business logic behind `OnlineContourGameScreen` — the room session
 * (state, host, players, quit) is the shared `useOnlineRoomSession`; this owns this device's draft
 * guess text and exposes already-resolved actions gated on "is it my turn"/"am I the host". Same
 * split, and same turn model, as Clues' own `useOnlineClueGame`: one shared board, one active player
 * at a time who either reveals the next hint (which passes the turn) or tries an answer.
 */
export const useOnlineContourGame = (code: string, onQuit: () => void) => {
  const { language } = useLanguage();
  const { localUid, connectionLost, connected, roomSettings, gameState, onlinePlayers, isHost, handleQuit } =
    useOnlineRoomSession(useContourRoomStore, { deleteRoom, removeRoomPlayer, pruneRoomPlayerData }, code, onQuit);

  // Countries ship with the app: the room only carries their codes, every device rebuilds the same
  // board from its own copy.
  const country = CONTOURS.find((candidate) => candidate.code === gameState.countryCodes[gameState.roundIndex]);
  // Same three values on every device, so the same coarse silhouette: see `roundSimplifySeed`.
  const simplifySeed = roundSimplifySeed(
    gameState.simplifySeed,
    gameState.roundIndex,
    gameState.countryCodes[gameState.roundIndex] ?? '',
  );
  // The round's hint steps: rebuilt on every device from the host's categories (in the room's
  // settings) and the country, so there is nothing more to store per round.
  const roomCategories = roomSettings?.hintCategories;
  const plan = useMemo(
    () => (country === undefined ? [] : buildHintPlan(normalizeHintCategories(roomCategories), country)),
    [country, roomCategories],
  );
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;
  const { hintsRevealed } = gameState;

  // This device's own in-progress guess text, and the "you got it wrong" banner.
  const { guessText, setGuessText, lastWrong, setLastWrong } = useGuessDraft(gameState.roundIndex, gameState.turnUid);

  /** What a correct guess earns right now: drops with each hint, 0 once the country is revealed. */
  const pointsAtStake = contourGuessPoints(hintsRevealed, plan.length);

  // Host-only: the turn-holder only ever self-reports a find/miss, this is the only thing that
  // writes `totalScores` (see `room.ts`'s own comment on `applyContourRoomScore`).
  const applyScore = useCallback(
    (totalScores: Record<string, number>) => applyContourRoomScore(code, totalScores),
    [code],
  );
  useHostTurnScoring(isHost, gameState, pointsAtStake, CONTOUR_WRONG_GUESS_PENALTY, applyScore);
  const passTurn = useCallback((uid: string) => passRoomTurn(code, uid), [code]);
  useHostTurnRecovery(isHost, gameState, onlinePlayers, passTurn);

  const revealHint = () => {
    const next = nextPlayerUid(onlinePlayers, localUid);
    if (!isMyTurn || hintsRevealed >= plan.length || next === undefined) return;
    revealContourRoomHint(code, hintsRevealed + 1, next).catch(() => {});
  };

  const submitGuess = () => {
    if (!isMyTurn || localUid === null || country === undefined) return;
    const correct = normalizeContourGuess(guessText) === normalizeContourGuess(countryName(country.code, language));
    if (correct) {
      reportContourRoomCorrect(code, localUid).catch(() => {});
      return;
    }
    reportContourRoomWrong(code, localUid, gameState.wrongGuessSeq + 1).catch(() => {});
    setLastWrong(onlinePlayers.find((player) => player.uid === localUid)?.name ?? '');
    setGuessText('');
  };

  /** Once the name has been revealed (the last step of the plan) nobody scores — a deliberate explicit click rather
   * than an automatic transition the instant the name appears, like the local game. */
  const giveUp = () => {
    if (!isMyTurn) return;
    giveUpContourRoom(code).catch(() => {});
  };

  const goToNextRound = () => {
    const firstTurnUid = onlinePlayers[0]?.uid;
    if (!isHost || firstTurnUid === undefined) return;
    nextContourRoomRound(code, gameState.roundIndex + 1, gameState.countryCodes.length, firstTurnUid).catch(() => {});
  };

  return {
    localUid,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    isHost,
    country,
    plan,
    simplifySeed,
    isMyTurn,
    pointsAtStake,
    guessText,
    setGuessText,
    lastWrong,
    revealHint,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
  };
};
