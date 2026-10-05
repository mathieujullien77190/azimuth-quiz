import { onSnapshot, updateDoc } from 'firebase/firestore';

import type { ContourSettings } from '@/types';

import { createRoomApi } from '@/helpers/roomBase';

import type { HintPick } from './hintPlan';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note).
//
// Rooms with `game: 'silhouette'` in the shared `rooms` collection, same turn-by-turn model as Clues': one
// shared board, hints revealed one tier at a time, one active player at a time. The room lifecycle
// (create/join/leave/colors/settings sync) is the shared `createRoomApi`; only the round state
// below is Silhouette-specific. Countries are shipped with the app, so the room only carries their
// codes — every device rebuilds the same board from its own copy of the data.

export { ROOM_MAX_PLAYERS } from '@/helpers/roomBase';
export { isValidRoomCode } from '@/helpers/roomCode';

/** What a room shares with its joiners: every setting except `playerName`, which stays local to
 * each device/player. */
export type ContourRoomSettings = Omit<ContourSettings, 'playerName'>;

export const contourRoomSettingsFrom = (settings: ContourSettings): ContourRoomSettings => {
  const { playerName, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<ContourRoomSettings>('silhouette');
export const {
  createRoom,
  roomExists,
  updateRoomSettings,
  subscribeToRoomSettings,
  joinRoomPresence,
  removeRoomPlayer,
  deleteRoom,
  restartRoom,
  sendReaction,
  pruneRoomPlayerData,
  sendHeartbeat,
  passRoomTurn,
  updateRoomPlayerColors,
} = rooms;
const { roomRef } = rooms;

/** Which screen the room is showing right now — `'options'` (the lobby/setup, the implicit default
 * while this field is absent) until the host starts the game. Like Clues, a round being over is
 * signaled by `verdict`, not by a screen change: one shared board everyone sees identically. */
export type ContourRoomScreen = 'options' | 'game' | 'end';

/** See `createRoomApi`'s `subscribeToRoomPlayers`, typed with Silhouette's own screens. */
export const subscribeToRoomPlayers = rooms.subscribeToRoomPlayers<ContourRoomScreen>;

/** Host-only: starts the online game, moving every connected device to the game screen. Every
 * round's country is drawn upfront by the host (`pickContourRoundCodes`), and whoever's first in
 * arrival order gets the first turn. `simplifySeed` (also drawn by the host) is what makes every
 * device draw the very same coarse silhouettes (see `roundSimplifySeed`). */
export const startContourRoomGame = (
  code: string,
  countryCodes: string[],
  firstTurnUid: string,
  simplifySeed: number,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: 'game' satisfies ContourRoomScreen,
    countryCodes,
    simplifySeed,
    roundIndex: 0,
    hintsRevealed: 0,
    hintPicks: [],
    quadrantsRevealed: [],
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    wrongGuessUid: null,
    wrongGuessSeq: 0,
    wrongGuessHints: null,
    totalScores: {},
    typing: null,
  });

/** Turn-holder-only (security rules check `request.auth.uid == resource.data.turnUid`): reveals the hint
 * the player picked (`picks` = every group picked so far this round, in order; see `orderHintPlan`) and passes the turn. */
export const revealContourRoomHint = (code: string, picks: HintPick[], nextTurnUid: string): Promise<void> =>
  updateDoc(roomRef(code), { hintPicks: picks, hintsRevealed: picks.length, turnUid: nextTurnUid });

/** Turn-holder-only: opens one more cell of the board. It counts as a hint and passes the turn, like `revealContourRoomHint`:
 * `picks` = every pick so far this round with the cell opening (`QUADRANT_PICK`) added, `quadrants` = every cell opened so
 * far beyond the starting one (see `helpers/quadrants.ts`) — all in ONE write, so no device sees one without the other. */
export const revealContourRoomQuadrant = (
  code: string,
  picks: HintPick[],
  quadrants: number[],
  nextTurnUid: string,
): Promise<void> =>
  updateDoc(roomRef(code), {
    hintPicks: picks,
    hintsRevealed: picks.length,
    quadrantsRevealed: quadrants,
    turnUid: nextTurnUid,
  });

/** Turn-holder-only: mirrors the answer being typed, so the other players can watch it live (same as Clues'
 * `setClueRoomTyping`). */
export const setContourRoomTyping = (code: string, uid: string, text: string): Promise<void> =>
  updateDoc(roomRef(code), { typing: { uid, text } satisfies ContourRoomGameState['typing'] });

/** Turn-holder-only: self-reports having found the country — ends the round. The score itself is
 * never written here (see `applyContourRoomScore`): the guesser only ever reports the event, the
 * host alone computes and writes the score. */
export const reportContourRoomCorrect = (code: string, uid: string): Promise<void> =>
  updateDoc(roomRef(code), {
    verdict: 'correct' satisfies ContourRoomGameState['verdict'],
    roundWinnerUid: uid,
  });

/** Turn-holder-only: nobody found it (the name has been revealed) — ends the round, nobody's
 * score moves. */
export const giveUpContourRoom = (code: string): Promise<void> =>
  updateDoc(roomRef(code), { verdict: 'giveUp' satisfies ContourRoomGameState['verdict'] });

/** Turn-holder-only: self-reports a wrong guess (the round stays open). `seq` must be strictly
 * greater than the room's current `wrongGuessSeq` (the caller's own `gameState.wrongGuessSeq + 1`)
 * so the host can tell repeated wrong guesses by the same player apart from a no-op resend. */
export const reportContourRoomWrong = (code: string, uid: string, seq: number, hintsRevealed: number): Promise<void> =>
  updateDoc(roomRef(code), { wrongGuessUid: uid, wrongGuessSeq: seq, wrongGuessHints: hintsRevealed });

/** Host-only: writes the updated running totals once it's observed `verdict === 'correct'` (a
 * find) or `wrongGuessSeq` advancing (a miss) — the only thing that ever writes `totalScores`. */
export const applyContourRoomScore = (code: string, totalScores: Record<string, number>): Promise<void> =>
  updateDoc(roomRef(code), { totalScores });

/** Host-only: moves on to the next round (fresh board, first turn to the next player in the
 * rotation — see `playersForRound`) or, past the last country, ends the game. */
export const nextContourRoomRound = (
  code: string,
  roundIndex: number,
  roundCount: number,
  firstTurnUid: string,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: (roundIndex < roundCount ? 'game' : 'end') satisfies ContourRoomScreen,
    roundIndex,
    hintsRevealed: 0,
    hintPicks: [],
    quadrantsRevealed: [],
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    // A new round starts with no guess made: the "one guess per turn" rule reads this (see `turnGuess.ts`).
    wrongGuessHints: null,
    typing: null,
  });

export type ContourRoomGameState = {
  screen: ContourRoomScreen;
  countryCodes: string[];
  /** Room-wide seed of the silhouettes' random simplification, drawn by the host at launch (0 for a
   * room that has none: the silhouettes then just come out the same for everyone). */
  simplifySeed: number;
  roundIndex: number;
  /** How many hints are out this round: every pick counts, a cell opening included (`hintPicks.length`). The plan steps
   * on the board are the picks that are not cell openings (`stepsOutOf`); see `buildHintPlan`/`contourPoints`. */
  hintsRevealed: number;
  /** The picks so far this round, in order (see `orderHintPlan`): `hintsRevealed` of them. A pick is a group of the hint
   * list, or the opening of a cell of the board (`QUADRANT_PICK`: a hint for the points, no plan step). */
  hintPicks: HintPick[];
  /** The cells of the board opened this round beyond the starting one, in order (0-3, see `helpers/quadrants.ts`). */
  quadrantsRevealed: number[];
  turnUid: string | null;
  /** The turn-holder's in-progress answer text, live (see `setContourRoomTyping`): `null` outside any typing. */
  typing: { uid: string; text: string } | null;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  /** Last wrong guess reported — never reset between rounds, `wrongGuessSeq` only ever increases,
   * so the host's scoring effect can tell a new miss apart from the same snapshot re-delivered. */
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
  /** How many clues/hints were out at that wrong guess: the turn-holder cannot guess again until one more is revealed
   * (`turnGuess.ts`). Reset to null at every round start; null (or missing, in an older room) = no restriction. */
  wrongGuessHints: number | null;
  totalScores: Record<string, number>;
};

/** Live round state for a room. Skips the update once the room itself is gone, same reasoning as
 * Compass' identical `subscribeToRoomGame`. */
export const subscribeToRoomGame = (code: string, onUpdate: (state: ContourRoomGameState) => void): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    onUpdate({
      screen: (data?.screen as ContourRoomScreen | undefined) ?? 'options',
      countryCodes: (data?.countryCodes as string[] | undefined) ?? [],
      simplifySeed: (data?.simplifySeed as number | undefined) ?? 0,
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      hintsRevealed: (data?.hintsRevealed as number | undefined) ?? 0,
      hintPicks: (data?.hintPicks as HintPick[] | undefined) ?? [],
      quadrantsRevealed: (data?.quadrantsRevealed as number[] | undefined) ?? [],
      turnUid: (data?.turnUid as string | undefined) ?? null,
      typing: (data?.typing as ContourRoomGameState['typing'] | undefined) ?? null,
      verdict: (data?.verdict as ContourRoomGameState['verdict'] | undefined) ?? null,
      roundWinnerUid: (data?.roundWinnerUid as string | undefined) ?? null,
      wrongGuessUid: (data?.wrongGuessUid as string | undefined) ?? null,
      wrongGuessSeq: (data?.wrongGuessSeq as number | undefined) ?? 0,
      wrongGuessHints: (data?.wrongGuessHints as number | undefined) ?? null,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
    });
  });
