import { onSnapshot, updateDoc } from 'firebase/firestore';

import type { ClueId, ClueSettings, CluePlace, Origin } from '@/types';

import { createRoomApi } from '@/helpers/roomBase';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// same reason Compass's own `games/compass/helpers/room.ts` stays out of it too.
//
// Rooms with `game: 'clues'` in the shared `rooms` collection. Clues' round state is a single
// shared board revealed turn-by-turn (one active player at a time), not Compass' "everyone
// answers independently, then reveal" model. The room lifecycle itself (create/join/leave/colors/
// settings sync) is the shared `createRoomApi`; only the round state below is Clues-specific.

export {
  ROOM_MAX_PLAYERS,
  type RoomPlayer as ClueRoomPlayer,
  type RoomPlayers as ClueRoomPlayers,
} from '@/helpers/roomBase';
export { isValidRoomCode } from '@/helpers/roomCode';

/** What a room shares with its joiners: every game setting except `playerName`, which stays
 * local to each device/player. */
export type ClueRoomSettings = Omit<ClueSettings, 'playerName'>;

export const clueRoomSettingsFrom = (settings: ClueSettings): ClueRoomSettings => {
  const { playerName, ...roomSettings } = settings;
  return roomSettings;
};

const rooms = createRoomApi<ClueRoomSettings>('clues');
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

/** Which screen the room is showing right now — `'options'` (the lobby/setup, the implicit
 * default while this field is absent) until the host starts the game. Unlike Compass there's no
 * separate `'reveal'` value: a round being over is signaled by `verdict` (see
 * `ClueRoomGameState`), not by a screen change — there's no "some players still answering while
 * others already see partial results" gap to bridge here, it's one shared board everyone sees
 * identically at all times. */
export type ClueRoomScreen = 'options' | 'game' | 'end';

/** See `createRoomApi`'s `subscribeToRoomPlayers`, typed with Clues' own screens. */
export const subscribeToRoomPlayers = rooms.subscribeToRoomPlayers<ClueRoomScreen>;

/** What the host seeds the whole game with, once — the shared origin (its own GPS/custom
 * position, same as Compass) and every round's place, picked upfront (see
 * `ClueSetupScreen/helpers.ts`'s `pickClueRoundPlaces`). */
export type ClueRoomGamePayload = { origin: Origin; places: CluePlace[] };

const initialRevealedClueIds = (startWithFirstLetter: boolean): ClueId[] => (startWithFirstLetter ? ['letter'] : []);

/** Host-only: starts the online game, moving every connected device to the game screen. Whoever's
 * first in arrival order (`onlinePlayersFrom`) gets the first turn. */
export const startClueRoomGame = (
  code: string,
  payload: ClueRoomGamePayload,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: 'game' satisfies ClueRoomScreen,
    origin: payload.origin,
    places: payload.places,
    roundIndex: 0,
    revealedClueIds: initialRevealedClueIds(startWithFirstLetter),
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    wrongGuessUid: null,
    wrongGuessSeq: 0,
    totalScores: {},
    typing: null,
  });

/** Turn-holder-only (security rules check `request.auth.uid == resource.data.turnUid`): reveals
 * one more clue and passes the turn — `revealedClueIds` is the already-appended array (the
 * turn-holder's own device already has the authoritative current one from `subscribeToRoomGame`,
 * see `useOnlineClueGame`), not appended server-side, since a clue can appear more than once
 * (multi-stage clues) and Firestore's `arrayUnion` would silently dedupe that. */
export const pickClueRoomClue = (code: string, revealedClueIds: ClueId[], nextTurnUid: string): Promise<void> =>
  updateDoc(roomRef(code), { revealedClueIds, turnUid: nextTurnUid });

/** Turn-holder-only: mirrors this device's in-progress answer text, so the other players can watch
 * it live (see `useOnlineClueGame`, debounced ~500ms and only written when it actually changed —
 * every write here is re-read by every connected player, same cost concern as the presence
 * heartbeat). Cleared (`''`) once the guess is empty again or a guess has been submitted. */
export const setClueRoomTyping = (code: string, uid: string, text: string): Promise<void> =>
  updateDoc(roomRef(code), { typing: { uid, text } satisfies ClueRoomGameState['typing'] });

/** Turn-holder-only: self-reports having found the place — ends the round. The score itself is
 * never written here (see `applyClueRoomScore`): same trust boundary as Compass, where the
 * guesser only ever reports the event, the host alone computes and writes the score. */
export const reportClueRoomCorrect = (code: string, uid: string): Promise<void> =>
  updateDoc(roomRef(code), { verdict: 'correct' satisfies ClueRoomGameState['verdict'], roundWinnerUid: uid });

/** Turn-holder-only: gives up — ends the round, nobody's score moves. */
export const giveUpClueRoom = (code: string): Promise<void> =>
  updateDoc(roomRef(code), { verdict: 'giveUp' satisfies ClueRoomGameState['verdict'] });

/** Turn-holder-only: self-reports a wrong guess (the round stays open — see the local game's own
 * `settle`) — same self-report-only-the-event pattern as `reportClueRoomCorrect`: the penalty
 * itself is never written here, only the host's scoring effect ever touches `totalScores`.
 * `seq` must be strictly greater than the room's current `wrongGuessSeq` (the caller's own
 * `gameState.wrongGuessSeq + 1`) so the host can tell repeated wrong guesses by the same player
 * apart from a no-op resend. */
export const reportClueRoomWrong = (code: string, uid: string, seq: number): Promise<void> =>
  updateDoc(roomRef(code), { wrongGuessUid: uid, wrongGuessSeq: seq });

/** Host-only: writes the updated running totals once it's observed `verdict === 'correct'` (a
 * find) or `wrongGuessSeq` advancing (a miss) — see `useOnlineClueGame`'s scoring effect — the
 * only thing that ever writes `totalScores`. */
export const applyClueRoomScore = (code: string, totalScores: Record<string, number>): Promise<void> =>
  updateDoc(roomRef(code), { totalScores });

/** Host-only: moves on to the next round (fresh board, first turn to the next player in the
 * rotation — see `playersForRound`) or, past the last place, ends the game. */
export const nextClueRoomRound = (
  code: string,
  roundIndex: number,
  placeCount: number,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(roomRef(code), {
    screen: (roundIndex < placeCount ? 'game' : 'end') satisfies ClueRoomScreen,
    roundIndex,
    revealedClueIds: initialRevealedClueIds(startWithFirstLetter),
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
    typing: null,
  });

export type ClueRoomGameState = {
  screen: ClueRoomScreen;
  origin: Origin | null;
  places: CluePlace[];
  roundIndex: number;
  revealedClueIds: ClueId[];
  turnUid: string | null;
  verdict: 'correct' | 'giveUp' | null;
  roundWinnerUid: string | null;
  /** Last wrong guess reported (see `reportClueRoomWrong`) — never reset between rounds,
   * `wrongGuessSeq` only ever increases, so the host's scoring effect can tell a new miss apart
   * from the same snapshot re-delivered. */
  wrongGuessUid: string | null;
  wrongGuessSeq: number;
  totalScores: Record<string, number>;
  /** The turn-holder's in-progress answer text, live (see `setClueRoomTyping`) — `null` outside any
   * write yet (a fresh room, or once cleared). Only trust it when `uid` still matches the room's own
   * `turnUid`: it is never reset on a turn/round change by itself, so a stale value from the
   * previous turn-holder must be told apart from a fresh one. */
  typing: { uid: string; text: string } | null;
};

/** Live round state for a room. Skips the update once the room itself is gone, same reasoning as
 * Compass's identical `subscribeToRoomGame`. */
export const subscribeToRoomGame = (code: string, onUpdate: (state: ClueRoomGameState) => void): (() => void) =>
  onSnapshot(roomRef(code), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    onUpdate({
      screen: (data?.screen as ClueRoomScreen | undefined) ?? 'options',
      origin: (data?.origin as Origin | undefined) ?? null,
      places: (data?.places as CluePlace[] | undefined) ?? [],
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      revealedClueIds: (data?.revealedClueIds as ClueId[] | undefined) ?? [],
      turnUid: (data?.turnUid as string | undefined) ?? null,
      verdict: (data?.verdict as ClueRoomGameState['verdict'] | undefined) ?? null,
      roundWinnerUid: (data?.roundWinnerUid as string | undefined) ?? null,
      wrongGuessUid: (data?.wrongGuessUid as string | undefined) ?? null,
      wrongGuessSeq: (data?.wrongGuessSeq as number | undefined) ?? 0,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
      typing: (data?.typing as ClueRoomGameState['typing'] | undefined) ?? null,
    });
  });
