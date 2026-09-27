import { signInAnonymously } from 'firebase/auth';
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

import type { GameSettings, Guess, Origin, Place, RoundScore } from '@/types';

import { auth, db } from '@/helpers/firebase';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// keeping this out of the barrel means only whatever actually calls into Firestore pays that
// cost, not every test that imports `@/helpers` for something unrelated.

// No c/h/w/z/g/q/x/j — awkward to say out loud in French, dropped by request.
const CODE_CONSONANTS = 'bdfklmnprstv';
// Only a/i/o — e and u dropped by request (too easy to confuse said out loud).
const CODE_VOWELS = 'aio';
const CODE_SYLLABLES = 4;

/** Every room code is `CODE_SYLLABLES` consonant+vowel pairs — a code is complete once it
 * reaches this length, before that it's still being typed. */
export const ROOM_CODE_LENGTH = CODE_SYLLABLES * 2;

const ROOM_CODE_PATTERN = new RegExp(`^([${CODE_CONSONANTS}][${CODE_VOWELS}]){${CODE_SYLLABLES}}$`);

/** Whether a string has the exact consonant+vowel shape of a generated room code — checked
 * before ever querying Firestore, so typing something the wrong shape (however long) never
 * fires a "code not found" against the backend for no reason. */
export const isValidRoomCode = (code: string): boolean => ROOM_CODE_PATTERN.test(code);

const randomChar = (chars: string): string => chars[Math.floor(Math.random() * chars.length)];

/** A short, easy-to-say room code: 4 consonant+vowel syllables (e.g. "tarabota"), not a random
 * alphanumeric string — (12 consonants × 3 vowels)^4 ≈ 1.7M combinations, plenty for a handful of
 * friends playing together. Collisions aren't checked here: `createRoom` retries on one. */
export const generateRoomCode = (): string =>
  Array.from({ length: CODE_SYLLABLES }, () => randomChar(CODE_CONSONANTS) + randomChar(CODE_VOWELS)).join('');

/** What a room shares with its joiners: every game setting except `playerNames`, which stays
 * local to each device/player. */
export type RoomSettings = Omit<GameSettings, 'playerNames'>;

export const roomSettingsFrom = (settings: GameSettings): RoomSettings => {
  const { playerNames, ...roomSettings } = settings;
  return roomSettings;
};

/** An anonymous Firebase Auth uid, signing in if needed — proves "the device that created this
 * room" to security rules without any actual login screen. Exported as `getLocalUid` for any
 * screen that needs to know its own uid outside of a presence/room write (e.g. the online game
 * screen, to tell its own guess apart from everyone else's). */
const ensureSignedIn = async (): Promise<string> => {
  if (auth.currentUser) return auth.currentUser.uid;
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
};
export const getLocalUid = ensureSignedIn;

/** Deletes every room this uid previously hosted — called right before creating a new one, so a
 * host never accumulates abandoned rooms every time it starts a fresh game. */
const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
  const snapshot = await getDocs(query(collection(db, 'rooms'), where('hostUid', '==', hostUid)));
  await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
};

/** Creates a new room under a fresh code, retrying on the rare collision with an existing one,
 * seeded with the host's current settings and stamped with its uid — security rules only let
 * that same uid update the room's settings afterwards. Returns the code that ended up winning.
 * First clears out any room this uid hosted before (see `deletePreviousRoomsByHost`). */
export const createRoom = async (settings: RoomSettings): Promise<string> => {
  const hostUid = await ensureSignedIn();
  await deletePreviousRoomsByHost(hostUid);
  for (;;) {
    const code = generateRoomCode();
    const ref = doc(db, 'rooms', code);
    if ((await getDoc(ref)).exists()) continue;

    await setDoc(ref, { createdAt: serverTimestamp(), hostUid, settings });
    return code;
  }
};

/** Whether a room with this code currently exists (join flow: validate before moving on). */
export const roomExists = async (code: string): Promise<boolean> => {
  const snapshot = await getDoc(doc(db, 'rooms', code));
  return snapshot.exists();
};

/** Pushes the host's settings to its room, so joiners watching it pick up the change. */
export const updateRoomSettings = (code: string, settings: RoomSettings): Promise<void> =>
  updateDoc(doc(db, 'rooms', code), { settings });

/** Live settings from a room: fires once with whatever's already there, then again on every
 * host change, until unsubscribed (the returned function). */
export const subscribeToRoomSettings = (code: string, onSettings: (settings: RoomSettings) => void): (() => void) =>
  onSnapshot(doc(db, 'rooms', code), (snapshot) => {
    const settings = snapshot.data()?.settings as RoomSettings | undefined;
    if (settings) onSettings(settings);
  });

/** A room can't hold more connected players than it has distinct colors for. */
export const ROOM_MAX_PLAYERS = 10;

// `color` is assigned by the host alone (see `updateRoomPlayerColors`), never computed locally —
// a joiner just reads whatever's there, so every device always agrees on who's which color
// without needing to agree on how to compute it.
export type RoomPlayer = { name: string; joinedAt: Timestamp | null; color?: string };
export type RoomPlayers = Record<string, RoomPlayer>;

/** Escapes `text` for use inside a `RegExp` — only ever called on a player's own display name
 * here, but that's still arbitrary user input. */
const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Resolves the name this joiner should get, numbering it against `name`'s other occurrences
 * already in the room — a first collision numbers *both* ("Matou"/"Matou" become "Matou1"/
 * "Matou2", not "Matou"/"Matou2": leaving the earlier one bare reads as if it were the "real"
 * Matou), a further one just picks the next free number ("Matou3"...). `renameUid`/`renameName`
 * are only set for that retroactive rename of the earlier, still-bare player. */
const resolveName = (
  name: string,
  players: RoomPlayers,
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

/** Registers (or renames) this device as a connected player in the room, returning its own uid
 * so the caller can tell its own entry apart from everyone else's. A no-op past
 * `ROOM_MAX_PLAYERS` distinct players, for a device that isn't already one of them. Only ever
 * touches `name`/`joinedAt` (and, on a name collision, another player's `name` — see
 * `resolveName`), each its own field path — never `color`, not even to preserve it: writing
 * `players.{uid}` as a whole (replacing the nested map in one shot) would otherwise wipe out
 * whatever color the host already assigned there. */
export const joinRoomPresence = async (code: string, name: string): Promise<string> => {
  const uid = await ensureSignedIn();
  const ref = doc(db, 'rooms', code);
  const players = ((await getDoc(ref)).data()?.players as RoomPlayers | undefined) ?? {};
  const existing = players[uid];
  if (existing || Object.keys(players).length < ROOM_MAX_PLAYERS) {
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

/** Removes a player from the room. Security rules only let the room's host (`resource.data.
 * hostUid`) remove someone else's entry — a non-host can only add/rename its own. */
export const removeRoomPlayer = (code: string, uid: string): Promise<void> =>
  updateDoc(doc(db, 'rooms', code), { [`players.${uid}`]: deleteField() });

/** Host-only: deletes the room outright — used when the host quits mid-game, so joiners see it
 * vanish (`subscribeToRoomPlayers`'s `exists` flag going false) instead of being stuck on a room
 * that will never advance again. Covered by the same security rule as any other host action. */
export const deleteRoom = (code: string): Promise<void> => deleteDoc(doc(db, 'rooms', code));

/** Host-only: writes a `color` for one or more players at once (the host recomputing everyone's
 * color from scratch whenever the connected-players list changes — see SetupScreen). Covered by
 * the same "host can change anything" security rule as settings, not the "own uid only" one a
 * non-host writes under. A no-op on an empty map (Firestore rejects a field-less update). */
export const updateRoomPlayerColors = (code: string, colorByUid: Record<string, string>): Promise<void> => {
  const entries = Object.entries(colorByUid).map(([uid, color]) => [`players.${uid}.color`, color]);
  return entries.length === 0 ? Promise.resolve() : updateDoc(doc(db, 'rooms', code), Object.fromEntries(entries));
};

/** Which screen the room is showing right now — `'options'` (the lobby/setup, the implicit
 * default while this field is absent) until the host starts the game (see `startRoomGame`). */
export type RoomScreen = 'options' | 'game' | 'reveal' | 'end';

/** Live connected-players map for a room (keyed by uid) plus its host's uid, until unsubscribed
 * — the host uid lets the UI mark that entry, and isn't itself in `players` unless the host has
 * also gone through `joinRoomPresence` (it always does, right after creating). `exists` is false
 * once the room itself is gone (host started a new one — see `deletePreviousRoomsByHost`), so a
 * joiner can tell "the room was deleted" apart from "everyone but me left". `screen` is included
 * here too (rather than its own listener on the same doc) purely so the setup screen — which
 * already holds this subscription open for the players list — can notice `'game'` and navigate
 * everyone across, without opening a second redundant listener on the same document. */
export const subscribeToRoomPlayers = (
  code: string,
  onUpdate: (players: RoomPlayers, hostUid: string | undefined, exists: boolean, screen: RoomScreen) => void,
): (() => void) =>
  onSnapshot(doc(db, 'rooms', code), (snapshot) => {
    const data = snapshot.data();
    onUpdate(
      (data?.players as RoomPlayers | undefined) ?? {},
      data?.hostUid as string | undefined,
      snapshot.exists(),
      (data?.screen as RoomScreen | undefined) ?? 'options',
    );
  });

/** What the host seeds the whole game with, once — the shared origin (its own GPS/custom
 * position: scoring is always relative to the host, per design) and the full list of places for
 * every round (picked once up front, same as the local solo/same-device game). */
export type RoomGamePayload = { origin: Origin; places: Place[] };

/** Host-only: starts the online game, moving every connected device to the game screen. */
export const startRoomGame = (code: string, payload: RoomGamePayload): Promise<void> =>
  updateDoc(doc(db, 'rooms', code), {
    screen: 'game' satisfies RoomScreen,
    origin: payload.origin,
    places: payload.places,
    roundIndex: 0,
    guesses: {},
    scores: deleteField(),
    totalScores: {},
  });

/** Submits this device's own guess for the current round — the only write a non-host is allowed
 * on `guesses` (security rules restrict it to its own uid, same as `players`). */
export const submitRoomGuess = (code: string, uid: string, guess: Guess): Promise<void> =>
  updateDoc(doc(db, 'rooms', code), { [`guesses.${uid}`]: guess });

/** Host-only: once every connected player has a guess in, records this round's scores and the
 * updated running totals, and flips every device to the reveal screen. */
export const finishRoomRound = (
  code: string,
  scores: Record<string, RoundScore>,
  totalScores: Record<string, number>,
): Promise<void> => updateDoc(doc(db, 'rooms', code), { screen: 'reveal' satisfies RoomScreen, scores, totalScores });

/** Host-only: moves on to the next round (fresh guesses, no scores yet) or, past the last place,
 * ends the game. */
export const nextRoomRound = (code: string, roundIndex: number, placeCount: number): Promise<void> =>
  updateDoc(doc(db, 'rooms', code), {
    screen: (roundIndex < placeCount ? 'game' : 'end') satisfies RoomScreen,
    roundIndex,
    guesses: {},
    scores: deleteField(),
  });

export type RoomGameState = {
  screen: RoomScreen;
  origin: Origin | null;
  places: Place[];
  roundIndex: number;
  guesses: Record<string, Guess>;
  scores: Record<string, RoundScore> | null;
  totalScores: Record<string, number>;
};

/** Live round state for a room — the online game screen's one subscription for everything but
 * who's connected (see `subscribeToRoomPlayers`) and the host's settings (`subscribeToRoomSettings`).
 * Skips the update once the room itself is gone (same as `subscribeToRoomSettings`) rather than
 * reporting empty/default state: without this, a deleted room briefly flashed the "loading" screen
 * (`gameState.origin` reset to `null`) in the gap before `subscribeToRoomPlayers`'s own `exists`
 * flag caught up and showed the actual "room deleted" notice. */
export const subscribeToRoomGame = (code: string, onUpdate: (state: RoomGameState) => void): (() => void) =>
  onSnapshot(doc(db, 'rooms', code), (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    onUpdate({
      screen: (data?.screen as RoomScreen | undefined) ?? 'options',
      origin: (data?.origin as Origin | undefined) ?? null,
      places: (data?.places as Place[] | undefined) ?? [],
      roundIndex: (data?.roundIndex as number | undefined) ?? 0,
      guesses: (data?.guesses as Record<string, Guess> | undefined) ?? {},
      scores: (data?.scores as Record<string, RoundScore> | undefined) ?? null,
      totalScores: (data?.totalScores as Record<string, number> | undefined) ?? {},
    });
  });
