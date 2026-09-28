import {
  type Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import type { ClueId, ClueSettings, CluePlace, Origin } from '@/types';

import { db } from '@/helpers/firebase';
import { generateRoomCode, getLocalUid } from '@/helpers/roomCode';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// same reason Compass's own `games/compass/helpers/room.ts` stays out of it too.
//
// Deliberately its own collection (`clueRooms`, not Compass's `rooms`) and its own copy of the
// Firestore access layer, rather than a shared generic room module: Clues' round state is a single
// shared board revealed turn-by-turn (one active player at a time), not Compass's "everyone
// answers independently, then reveal" model — forcing both into one abstraction now would be a
// premature generalization over 2 shapes. Only the code-generation/anonymous-auth pieces (zero
// game-specific coupling) are shared, via `@/helpers/roomCode`.

export { ROOM_CODE_LENGTH, isValidRoomCode, getLocalUid } from '@/helpers/roomCode';

/** What a room shares with its joiners: every game setting except `playerNames`, which stays
 * local to each device/player. */
export type ClueRoomSettings = Omit<ClueSettings, 'playerNames'>;

export const clueRoomSettingsFrom = (settings: ClueSettings): ClueRoomSettings => {
  const { playerNames, ...roomSettings } = settings;
  return roomSettings;
};

/** Deletes every room this uid previously hosted — called right before creating a new one, so a
 * host never accumulates abandoned rooms every time it starts a fresh game. */
const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
  const snapshot = await getDocs(query(collection(db, 'clueRooms'), where('hostUid', '==', hostUid)));
  await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
};

/** Creates a new room under a fresh code, retrying on the rare collision with an existing one,
 * seeded with the host's current settings and stamped with its uid — security rules only let
 * that same uid update the room's settings afterwards. Returns the code that ended up winning.
 * First clears out any room this uid hosted before (see `deletePreviousRoomsByHost`). */
export const createRoom = async (settings: ClueRoomSettings): Promise<string> => {
  const hostUid = await getLocalUid();
  await deletePreviousRoomsByHost(hostUid);
  for (;;) {
    const code = generateRoomCode();
    const ref = doc(db, 'clueRooms', code);
    if ((await getDoc(ref)).exists()) continue;

    await setDoc(ref, { createdAt: serverTimestamp(), hostUid, settings });
    return code;
  }
};

/** Whether a room with this code currently exists (join flow: validate before moving on). */
export const roomExists = async (code: string): Promise<boolean> => {
  const snapshot = await getDoc(doc(db, 'clueRooms', code));
  return snapshot.exists();
};

/** Pushes the host's settings to its room, so joiners watching it pick up the change. */
export const updateRoomSettings = (code: string, settings: ClueRoomSettings): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { settings });

/** Live settings from a room: fires once with whatever's already there, then again on every
 * host change, until unsubscribed (the returned function). */
export const subscribeToRoomSettings = (
  code: string,
  onSettings: (settings: ClueRoomSettings) => void,
): (() => void) =>
  onSnapshot(doc(db, 'clueRooms', code), (snapshot) => {
    const settings = snapshot.data()?.settings as ClueRoomSettings | undefined;
    if (settings) onSettings(settings);
  });

/** A room can't hold more connected players than it has distinct colors for. */
export const CLUE_ROOM_MAX_PLAYERS = 10;

// `color` is assigned by the host alone (see `updateRoomPlayerColors`), never computed locally —
// a joiner just reads whatever's there, so every device always agrees on who's which color
// without needing to agree on how to compute it.
export type ClueRoomPlayer = { name: string; joinedAt: Timestamp | null; color?: string };
export type ClueRoomPlayers = Record<string, ClueRoomPlayer>;

/** Escapes `text` for use inside a `RegExp` — only ever called on a player's own display name
 * here, but that's still arbitrary user input. */
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Resolves the name this joiner should get, numbering it against `name`'s other occurrences
 * already in the room — see Compass's identical `resolveName` for the full reasoning. */
const resolveName = (
  name: string,
  players: ClueRoomPlayers,
  uid: string,
): { name: string; renameUid?: string; renameName?: string } => {
  const others = Object.entries(players).filter(([otherUid]) => otherUid !== uid);
  const bareMatch = others.find(([, player]) => player.name === name);
  if (bareMatch) {
    const [bareUid] = bareMatch;
    return { name: `${name}2`, renameUid: bareUid, renameName: `${name}1` };
  }
  const numberPattern = new RegExp(`^${escapeRegExp(name)}(\\d+)$`);
  const numbers = others
    .map(([, player]) => player.name.match(numberPattern)?.[1])
    .filter((match): match is string => match !== undefined)
    .map(Number);
  return numbers.length === 0 ? { name } : { name: `${name}${Math.max(...numbers) + 1}` };
};

/** Registers (or renames) this device as a connected player in the room, returning its own uid.
 * See Compass's identical `joinRoomPresence` for the full reasoning (per-field writes only, never
 * replaces the whole `players.{uid}` map so an assigned `color` survives). */
export const joinRoomPresence = async (code: string, name: string): Promise<string> => {
  const uid = await getLocalUid();
  const ref = doc(db, 'clueRooms', code);
  const players = ((await getDoc(ref)).data()?.players as ClueRoomPlayers | undefined) ?? {};
  const existing = players[uid];
  if (existing || Object.keys(players).length < CLUE_ROOM_MAX_PLAYERS) {
    const assignment = resolveName(name, players, uid);
    const updates: Record<string, unknown> = {
      [`players.${uid}.name`]: assignment.name,
      [`players.${uid}.joinedAt`]: existing?.joinedAt ?? serverTimestamp(),
    };
    if (assignment.renameUid !== undefined) updates[`players.${assignment.renameUid}.name`] = assignment.renameName;
    await updateDoc(ref, updates);
  }
  return uid;
};

/** Removes a player from the room. Security rules only let the room's host remove someone else's
 * entry — a non-host can only add/rename its own. */
export const removeRoomPlayer = (code: string, uid: string): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { [`players.${uid}`]: deleteField() });

/** Host-only: deletes the room outright. */
export const deleteRoom = (code: string): Promise<void> => deleteDoc(doc(db, 'clueRooms', code));

/** Host-only: writes a `color` for one or more players at once. A no-op on an empty map
 * (Firestore rejects a field-less update). */
export const updateRoomPlayerColors = (code: string, colorByUid: Record<string, string>): Promise<void> => {
  const entries = Object.entries(colorByUid).map(([uid, color]) => [`players.${uid}.color`, color]);
  return entries.length === 0
    ? Promise.resolve()
    : updateDoc(doc(db, 'clueRooms', code), Object.fromEntries(entries));
};

/** Which screen the room is showing right now — `'options'` (the lobby/setup, the implicit
 * default while this field is absent) until the host starts the game. Unlike Compass there's no
 * separate `'reveal'` value: a round being over is signaled by `verdict` (see
 * `ClueRoomGameState`), not by a screen change — there's no "some players still answering while
 * others already see partial results" gap to bridge here, it's one shared board everyone sees
 * identically at all times. */
export type ClueRoomScreen = 'options' | 'game' | 'end';

/** Live connected-players map for a room (keyed by uid) plus its host's uid, until unsubscribed —
 * see Compass's identical `subscribeToRoomPlayers` for the full reasoning. */
export const subscribeToRoomPlayers = (
  code: string,
  onUpdate: (players: ClueRoomPlayers, hostUid: string | undefined, exists: boolean, screen: ClueRoomScreen) => void,
): (() => void) =>
  onSnapshot(doc(db, 'clueRooms', code), (snapshot) => {
    const data = snapshot.data();
    onUpdate(
      (data?.players as ClueRoomPlayers | undefined) ?? {},
      data?.hostUid as string | undefined,
      snapshot.exists(),
      (data?.screen as ClueRoomScreen | undefined) ?? 'options',
    );
  });

/** What the host seeds the whole game with, once — the shared origin (its own GPS/custom
 * position, same as Compass) and every round's place, picked upfront (see
 * `ClueSetupScreen/helpers.ts`'s `pickClueRoundPlaces`). */
export type ClueRoomGamePayload = { origin: Origin; places: CluePlace[] };

const initialRevealedClueIds = (startWithFirstLetter: boolean): ClueId[] => (startWithFirstLetter ? ['letter'] : []);

/** Host-only: starts the online game, moving every connected device to the game screen. Whoever's
 * first in arrival order (`onlineClueRoomPlayersFrom`) gets the first turn. */
export const startClueRoomGame = (
  code: string,
  payload: ClueRoomGamePayload,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), {
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
  });

/** Turn-holder-only (security rules check `request.auth.uid == resource.data.turnUid`): reveals
 * one more clue and passes the turn — `revealedClueIds` is the already-appended array (the
 * turn-holder's own device already has the authoritative current one from `subscribeToRoomGame`,
 * see `useOnlineClueGame`), not appended server-side, since a clue can appear more than once
 * (multi-stage clues) and Firestore's `arrayUnion` would silently dedupe that. */
export const pickClueRoomClue = (
  code: string,
  revealedClueIds: ClueId[],
  nextTurnUid: string,
): Promise<void> => updateDoc(doc(db, 'clueRooms', code), { revealedClueIds, turnUid: nextTurnUid });

/** Turn-holder-only: self-reports having found the place — ends the round. The score itself is
 * never written here (see `applyClueRoomScore`): same trust boundary as Compass, where the
 * guesser only ever reports the event, the host alone computes and writes the score. */
export const reportClueRoomCorrect = (code: string, uid: string): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { verdict: 'correct' satisfies ClueRoomGameState['verdict'], roundWinnerUid: uid });

/** Turn-holder-only: gives up — ends the round, nobody's score moves. */
export const giveUpClueRoom = (code: string): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { verdict: 'giveUp' satisfies ClueRoomGameState['verdict'] });

/** Turn-holder-only: self-reports a wrong guess (the round stays open — see the local game's own
 * `settle`) — same self-report-only-the-event pattern as `reportClueRoomCorrect`: the penalty
 * itself is never written here, only the host's scoring effect ever touches `totalScores`.
 * `seq` must be strictly greater than the room's current `wrongGuessSeq` (the caller's own
 * `gameState.wrongGuessSeq + 1`) so the host can tell repeated wrong guesses by the same player
 * apart from a no-op resend. */
export const reportClueRoomWrong = (code: string, uid: string, seq: number): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { wrongGuessUid: uid, wrongGuessSeq: seq });

/** Host-only: writes the updated running totals once it's observed `verdict === 'correct'` (a
 * find) or `wrongGuessSeq` advancing (a miss) — see `useOnlineClueGame`'s scoring effect — the
 * only thing that ever writes `totalScores`. */
export const applyClueRoomScore = (code: string, totalScores: Record<string, number>): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), { totalScores });

/** Host-only: moves on to the next round (fresh board, first turn back to whoever went first) or,
 * past the last place, ends the game. */
export const nextClueRoomRound = (
  code: string,
  roundIndex: number,
  placeCount: number,
  firstTurnUid: string,
  startWithFirstLetter: boolean,
): Promise<void> =>
  updateDoc(doc(db, 'clueRooms', code), {
    screen: (roundIndex < placeCount ? 'game' : 'end') satisfies ClueRoomScreen,
    roundIndex,
    revealedClueIds: initialRevealedClueIds(startWithFirstLetter),
    turnUid: firstTurnUid,
    verdict: null,
    roundWinnerUid: null,
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
};

/** Live round state for a room. Skips the update once the room itself is gone, same reasoning as
 * Compass's identical `subscribeToRoomGame`. */
export const subscribeToRoomGame = (code: string, onUpdate: (state: ClueRoomGameState) => void): (() => void) =>
  onSnapshot(doc(db, 'clueRooms', code), (snapshot) => {
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
    });
  });
