import { reporting } from '@/helpers/reportError';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CONTOUR_WRONG_GUESS_PENALTY } from '@/games/contour/constants';
import {
  applyContourRoomScore,
  deleteRoom,
  giveUpContourRoom,
  nextContourRoomRound,
  passRoomTurn,
  pruneRoomPlayerData,
  removeRoomPlayer,
  restartRoom,
  sendReaction,
  reportContourRoomCorrect,
  reportContourRoomWrong,
  revealContourRoomHint,
  revealContourRoomQuadrant,
  setContourRoomTyping,
} from '@/games/contour/helpers/room';
import { normalizeContourGuess, roundCountryName } from '@/games/contour/helpers/contourCountry';
import {
  buildHintPlan,
  contourPoints,
  hintGroupsView,
  normalizeHintCategories,
  orderHintPlan,
  QUADRANT_PICK,
  quadrantPicksOf,
  type HintGroup,
} from '@/games/contour/helpers/hintPlan';
import { hiddenQuadrants, startQuadrant } from '@/games/contour/helpers/quadrants';
import { roundSimplifySeed } from '@/games/contour/helpers/simplify';
import { useRoundData } from '@/games/contour/helpers/useRoundData';
import type { ContourCountry } from '@/types';
import { useContourRoomStore } from '@/games/contour/store/roomStore';
import { nextPlayerUid, playersForRound } from '@/helpers/roomPlayers';
import { useDebouncedValue } from '@/helpers/useDebouncedValue';
import { hasGuessedThisTurn } from '@/helpers/turnGuess';
import { useDevFeedback } from '@/helpers/useDevFeedback';
import { useGuessDraft } from '@/helpers/useGuessDraft';
import { useHostTurnRecovery } from '@/helpers/useHostTurnRecovery';
import { useHostTurnScoring } from '@/helpers/useHostTurnScoring';
import { useOnlineRoomSession } from '@/helpers/useOnlineRoomSession';
import { useLanguage } from '@/i18n';

/** A stable empty list while the round loads (a new one at every render would redo the board's geometry). */
const NO_NEIGHBOR_COUNTRIES: ContourCountry[] = [];

/**
 * All the online-Silhouette business logic behind `OnlineContourGameScreen` — the room session
 * (state, host, players, quit) is the shared `useOnlineRoomSession`; this owns this device's draft
 * guess text and exposes already-resolved actions gated on "is it my turn"/"am I the host". Same
 * split, and same turn model, as Clues' own `useOnlineClueGame`: one shared board, one active player
 * at a time who either reveals the next hint (which passes the turn) or tries an answer.
 */
export const useOnlineContourGame = (code: string, onQuit: () => void) => {
  const { language } = useLanguage();
  const { localUid, connectionLost, connected, roomSettings, gameState, onlinePlayers, isHost, handleQuit, handleReplay, reactions } =
    useOnlineRoomSession(useContourRoomStore, { deleteRoom, restartRoom, sendReaction, removeRoomPlayer, pruneRoomPlayerData }, code, onQuit);

  // The room only carries the countries' codes: every device reads the round's country (and the ones around
  // it) from Firestore, the next round's already while this one is played.
  const {
    data: roundData,
    failed: roundFailed,
    retry: retryRound,
  } = useRoundData(gameState.countryCodes, gameState.roundIndex);
  const country = roundData?.country;
  const neighborCountries = roundData?.neighborCountries ?? NO_NEIGHBOR_COUNTRIES;
  // Same three values on every device, so the same coarse silhouette: see `roundSimplifySeed`.
  const simplifySeed = roundSimplifySeed(
    gameState.simplifySeed,
    gameState.roundIndex,
    gameState.countryCodes[gameState.roundIndex] ?? '',
  );
  // The round's hint steps: rebuilt on every device from the host's categories (in the room's settings) and the
  // country, then put in the order the players picked them (`hintPicks`, the only thing stored per round).
  const roomCategories = roomSettings?.hintCategories;
  const basePlan = useMemo(
    () => (country === undefined ? [] : buildHintPlan(normalizeHintCategories(roomCategories), country)),
    [country, roomCategories],
  );
  // Every pick is a hint (`hintsRevealed` = the picks), but only the ones that are not a cell opening bring a plan step out.
  const { hintsRevealed, hintPicks } = gameState;
  const quadrantPicks = quadrantPicksOf(hintPicks);
  const stepsRevealed = Math.max(0, hintsRevealed - quadrantPicks);
  const plan = useMemo(() => orderHintPlan(basePlan, hintPicks), [basePlan, hintPicks]);
  const hintGroups = useMemo(() => hintGroupsView(plan, stepsRevealed), [plan, stepsRevealed]);
  const isMyTurn = localUid !== null && localUid === gameState.turnUid;
  // One guess per turn: once the turn-holder has missed, the only thing left to him is to reveal a hint (which passes the
  // hand). Shared state (`wrongGuessHints`, see `turnGuess.ts`) says so on every device; the local guard covers the gap
  // before the room's update comes back, so a double tap cannot send a second guess.
  const hintsOut = hintsRevealed;
  const [guessGuard, setGuessGuard] = useState<{ round: number; hints: number } | null>(null);
  const guessedThisTurn =
    isMyTurn &&
    (hasGuessedThisTurn(gameState, hintsOut) ||
      (guessGuard !== null && guessGuard.round === gameState.roundIndex && guessGuard.hints === hintsOut));
  // Who plays in which order this round: arrival order rotated by the round number, so that each
  // player in turn opens a round (`playersForRound`). What the tabs show, too.
  const roundPlayers = playersForRound(onlinePlayers, gameState.roundIndex);

  // This device's own in-progress guess text, and the "you got it wrong" banner.
  const { guessText, setGuessText, lastWrong, setLastWrong } = useGuessDraft(gameState.roundIndex, gameState.turnUid);

  // Mirrors this device's own guess text to the room, ~500ms after it stops changing, so the other players can watch the
  // turn-holder type it live (`typing` in `ContourRoomGameState`, same as Clues). Solo (nobody else could see it) and
  // spectators never write; a round already over stops writing too, and an unchanged debounced value is not sent again.
  const debouncedGuessText = useDebouncedValue(guessText, 500);
  const lastWrittenTypingRef = useRef('');
  useEffect(() => {
    if (!isMyTurn || localUid === null || gameState.verdict !== null || onlinePlayers.length <= 1) return;
    if (lastWrittenTypingRef.current === debouncedGuessText) return;
    lastWrittenTypingRef.current = debouncedGuessText;
    setContourRoomTyping(code, localUid, debouncedGuessText).catch(reporting('silhouette.typing', { kind: 'background', room: code }));
  }, [debouncedGuessText, isMyTurn, localUid, gameState.verdict, onlinePlayers.length, code]);

  // What the turn-holder is typing, for everybody else mid-round: `typing.uid` is checked against `turnUid` because it is
  // never reset by itself on a turn change, so a leftover of the previous turn-holder must not leak into the new one's.
  const typedByActivePlayer =
    !isMyTurn && gameState.verdict === null && gameState.typing !== null && gameState.typing.uid === gameState.turnUid
      ? gameState.typing.text
      : '';

  // The board starts with a single open cell, picked from the round's seed (the same on every device); every other one the
  // turn-holder opens is a hint (`quadrantsRevealed`, the cells opened since): one off the points, and the turn passes.
  const { quadrantsRevealed } = gameState;
  const openingQuadrant = useMemo(
    () => (country === undefined ? null : startQuadrant(country, simplifySeed)),
    [country, simplifySeed],
  );
  const hiddenCells = openingQuadrant === null ? [] : hiddenQuadrants(openingQuadrant, quadrantsRevealed);

  /** What a correct guess earns right now: drops with each hint (a cell opening included), 0 once the country is revealed. */
  const pointsAtStake = contourPoints(stepsRevealed, quadrantPicks, plan.length);
  // A cell can be opened while the country itself is not out yet (afterwards there is nothing left to gain from it), and
  // what it would cost is shown on the cell: the points lost to one more hint.
  const canOpenQuadrant = stepsRevealed < plan.length;
  const quadrantCost = pointsAtStake - contourPoints(stepsRevealed, quadrantPicks + 1, plan.length);

  // Host-only: the turn-holder only ever self-reports a find/miss, this is the only thing that
  // writes `totalScores` (see `room.ts`'s own comment on `applyContourRoomScore`).
  const applyScore = useCallback(
    (totalScores: Record<string, number>) => applyContourRoomScore(code, totalScores),
    [code],
  );
  useHostTurnScoring(isHost, gameState, pointsAtStake, CONTOUR_WRONG_GUESS_PENALTY, applyScore);
  const passTurn = useCallback((uid: string) => passRoomTurn(code, uid), [code]);
  useHostTurnRecovery(isHost, gameState, roundPlayers, passTurn);

  /** Reveals the next step of `group` (the one the player tapped) and passes the turn. The country itself (the
   * `reveal` group) only once every other hint is out. */
  const revealHint = (group: HintGroup) => {
    const next = nextPlayerUid(onlinePlayers, localUid);
    if (!isMyTurn || next === undefined) return;
    const target = hintGroups.find((entry) => entry.group === group);
    const othersOut = hintGroups.every((entry) => entry.group === 'reveal' || entry.next === undefined);
    if (target?.next === undefined || (group === 'reveal' && !othersOut)) return;
    revealContourRoomHint(code, [...hintPicks, group], next).catch(reporting('silhouette.revealHint', { room: code }));
  };

  /** Opens one more cell of the board (the turn-holder only, while the round is on): everybody sees it, it counts as a hint
   * (the round pays less) and the turn passes, exactly like a hint picked in the list. */
  const revealQuadrant = (cell: number) => {
    const next = nextPlayerUid(onlinePlayers, localUid);
    if (!isMyTurn || next === undefined || gameState.verdict !== null || !canOpenQuadrant || !hiddenCells.includes(cell)) return;
    revealContourRoomQuadrant(code, [...hintPicks, QUADRANT_PICK], [...quadrantsRevealed, cell], next).catch(
      reporting('silhouette.revealQuadrant', { room: code }),
    );
  };

  const submitGuess = () => {
    if (!isMyTurn || guessedThisTurn || localUid === null || country === undefined) return;
    const correct = normalizeContourGuess(guessText) === normalizeContourGuess(roundCountryName(country, language));
    if (correct) {
      reportContourRoomCorrect(code, localUid).catch(reporting('silhouette.reportCorrect', { room: code }));
      return;
    }
    setGuessGuard({ round: gameState.roundIndex, hints: hintsOut });
    reportContourRoomWrong(code, localUid, gameState.wrongGuessSeq + 1, hintsOut).catch(reporting('silhouette.reportWrong', { room: code }));
    setLastWrong(onlinePlayers.find((player) => player.uid === localUid)?.name ?? '');
    setGuessText('');
  };

  /** Once the name has been revealed (the last step of the plan) nobody scores — a deliberate explicit click rather
   * than an automatic transition the instant the name appears, like the local game. */
  const giveUp = () => {
    if (!isMyTurn) return;
    giveUpContourRoom(code).catch(reporting('silhouette.giveUp', { room: code }));
  };

  const goToNextRound = () => {
    const nextRoundIndex = gameState.roundIndex + 1;
    // The next round's own order: the player after this round's opener takes the lead.
    const firstTurnUid = playersForRound(onlinePlayers, nextRoundIndex)[0]?.uid;
    if (!isHost || firstTurnUid === undefined) return;
    nextContourRoomRound(code, nextRoundIndex, gameState.countryCodes.length, firstTurnUid).catch(reporting('silhouette.nextRound', { room: code }));
  };

  // Dev mode: once the host has moved on from a round (or the game is over), a device with the dev code is asked how hard that round's country was.
  const devFeedback = useDevFeedback({
    game: 'silhouette',
    roundIndex: gameState.roundIndex,
    roundOver: gameState.verdict !== null,
    gameOver: gameState.screen === 'end',
    target:
      country === undefined
        ? undefined
        : { targetType: 'country', targetKey: country.code, name: country.fr, difficulty: country.difficulty },
  });

  return {
    localUid,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    roundPlayers,
    isHost,
    country,
    neighborCountries,
    roundFailed,
    retryRound,
    plan,
    hintGroups,
    stepsRevealed,
    simplifySeed,
    isMyTurn,
    guessedThisTurn,
    pointsAtStake,
    guessText,
    setGuessText,
    typedByActivePlayer,
    lastWrong,
    revealHint,
    hiddenQuadrants: hiddenCells,
    canOpenQuadrant,
    quadrantCost,
    revealQuadrant,
    submitGuess,
    giveUp,
    goToNextRound,
    handleQuit,
    handleReplay,
    reactions,
    devFeedback,
  };
};
