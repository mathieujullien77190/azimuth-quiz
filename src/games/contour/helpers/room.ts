import { onSnapshot, updateDoc } from 'firebase/firestore';

import type { ContourSettings } from '@/types';

import { createRoomApi } from '@/helpers/roomBase';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note).
//
// Silhouette's own `contourRooms` collection, same turn-by-turn model as Clues' (`clueRooms`): one
// shared board, hints revealed one tier at a time, one active player at a time. The room lifecycle
// (create/join/leave/colors/settings sync) is the shared `createRoomApi`; only the round state
// below is Silhouette-specific. Countries are shipped with the app, so the room only carries their
// codes — every device rebuilds the same board from its own copy of the data.

export { ROOM_MAX_PLAYERS } from '@/helpers/roomBase';
export { isValidRoomCode } from '@/helpers/roomCode';

/** What a room shares with its joiners: every setting except `playerNames`, which stays local to
 * each device/player. */
export type ContourRoomSettings = Omit<ContourSettings, 'playerNames'>;

export const contourRoomSettingsFrom = (settings: ContourSettings): ContourRoomSettings => {
  const { playerNames, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<ContourRoomSettings>('contourRooms');
export const {
  createRoom,
  roomExists,
  updateRoomSettings,
  subscribeToRoomSettings,
  joinRoomPresence,
  removeRoomPlayer,
  deleteRoom,
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
 * arrival order gets the first turn. */
export const startContourRoomGame = (code: string, countryCodes: string[], firstTurnUid: string): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: 'game' satisfies ContourRoomScreen,
    countryCodes,
    roundIndex: 0,
    hintsRevealed: 0,
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    wrongGuessUid: null,
    wrongGuessSeq: 0,
    totalScores: {},
  });

/** Turn-holder-only (security rules check `request.auth.uid == resource.data.turnUid`): reveals
 * the next hint tier and passes the turn. */
export const revealContourRoomHint = (code: string, hintsRevealed: number, nextTurnUid: string): Promise<void> =>
  updateDoc(roomRef(code), { hintsRevealed, turnUid: nextTurnUid });

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
export const reportContourRoomWrong = (code: string, uid: string, seq: number): Promise<void> =>
  updateDoc(roomRef(code), { wrongGuessUid: uid, wrongGuessSeq: seq });

/** Host-only: writes the updated running totals once it's observed `verdict === 'correct'` (a
 * find) or `wrongGuessSeq` advancing (a miss) — the only thing that ever writes `totalScores`. */
export const applyContourRoomScore = (code: string, totalScores: Record<string, number>): Promise<void> =>
  updateDoc(roomRef(code), { totalScores });

/** Host-only: moves on to the next round (fresh board, first turn back to whoever went first) or,
 * past the last country, ends the game. */
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
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
  });

export type ContourRoomGameState = {
  screen: ContourRoomScreen;
  countryCodes: string[];
  roundIndex: number;
  /** How many of the 4 hint tiers are revealed (0-4), see `CONTOUR_GUESS_POINTS_BY_HINTS`. */
  hintsRevealed: number;
  turnUid: string | null;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  /** Last wrong guess reported — never reset between rounds, `wrongGuessSeq` only ever increases,
   * so the host's scoring effect can tell a new miss apart from the same snapshot re-delivered. */
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
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
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      hintsRevealed: (data?.hintsRevealed as number | undefined) ?? 0,
      turnUid: (data?.turnUid as string | undefined) ?? null,
      verdict: (data?.verdict as ContourRoomGameState['verdict'] | undefined) ?? null,
      roundWinnerUid: (data?.roundWinnerUid as string | undefined) ?? null,
      wrongGuessUid: (data?.wrongGuessUid as string | undefined) ?? null,
      wrongGuessSeq: (data?.wrongGuessSeq as number | undefined) ?? 0,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
    });
  });
