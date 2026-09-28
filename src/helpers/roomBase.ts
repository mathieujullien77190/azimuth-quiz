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

import { db } from '@/helpers/firebase';
import { generateRoomCode, getLocalUid } from '@/helpers/roomCode';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// keeping this out of the barrel means only whatever actually calls into Firestore pays that
// cost, not every test that imports `@/helpers` for something unrelated.
//
// Everything about an online room that has no game-specific coupling — lifecycle (create/join/
// leave/delete), presence, player colors, settings sync — written once and bound to a game's own
// Firestore collection (`createRoomApi('rooms')` for Compass, `'clueRooms'`, `'contourRooms'`...).
// What a game writes into its room to actually play (round state, guesses, turns...) stays in that
// game's own `helpers/room.ts`, built on `roomRef`.

/** A room can't hold more connected players than it has distinct colors for. */
export const ROOM_MAX_PLAYERS = 10;

// `color` is assigned by the host alone (see `updateRoomPlayerColors`), never computed locally —
// a joiner just reads whatever's there, so every device always agrees on who's which color
// without needing to agree on how to compute it.
// `lastSeen` is this device's own heartbeat (see `sendHeartbeat`), only ever compared between
// snapshots ("did it change lately?") — never against a local clock, which can be skewed.
export type RoomPlayer = { name: string; joinedAt: Timestamp | null; color?: string; lastSeen?: Timestamp | null };
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

export const createRoomApi = <Settings extends object>(collectionName: string) => {
  const roomRef = (code: string) => doc(db, collectionName, code);

  /** Deletes every room this uid previously hosted — called right before creating a new one, so a
   * host never accumulates abandoned rooms every time it starts a fresh game. */
  const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
    const snapshot = await getDocs(query(collection(db, collectionName), where('hostUid', '==', hostUid)));
    await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
  };

  /** Creates a new room under a fresh code, retrying on the rare collision with an existing one,
   * seeded with the host's current settings and stamped with its uid — security rules only let
   * that same uid update the room's settings afterwards. Returns the code that ended up winning.
   * First clears out any room this uid hosted before (see `deletePreviousRoomsByHost`). */
  const createRoom = async (settings: Settings): Promise<string> => {
    const hostUid = await getLocalUid();
    await deletePreviousRoomsByHost(hostUid);
    for (;;) {
      const code = generateRoomCode();
      const ref = roomRef(code);
      if ((await getDoc(ref)).exists()) continue;

      await setDoc(ref, { createdAt: serverTimestamp(), hostUid, settings });
      return code;
    }
  };

  /** Whether a room with this code currently exists (join flow: validate before moving on). */
  const roomExists = async (code: string): Promise<boolean> => (await getDoc(roomRef(code))).exists();

  /** Pushes the host's settings to its room, so joiners watching it pick up the change. */
  const updateRoomSettings = (code: string, settings: Settings): Promise<void> =>
    updateDoc(roomRef(code), { settings });

  /** Live settings from a room: fires once with whatever's already there, then again on every
   * host change, until unsubscribed (the returned function). */
  const subscribeToRoomSettings = (code: string, onSettings: (settings: Settings) => void): (() => void) =>
    onSnapshot(roomRef(code), (snapshot) => {
      const settings = snapshot.data()?.settings as Settings | undefined;
      if (settings) onSettings(settings);
    });

  /** Registers (or renames) this device as a connected player in the room, returning its own uid
   * so the caller can tell its own entry apart from everyone else's. A no-op past
   * `ROOM_MAX_PLAYERS` distinct players, for a device that isn't already one of them. Only ever
   * touches `name`/`joinedAt` (and, on a name collision, another player's `name` — see
   * `resolveName`), each its own field path — never `color`, not even to preserve it: writing
   * `players.{uid}` as a whole (replacing the nested map in one shot) would otherwise wipe out
   * whatever color the host already assigned there. */
  const joinRoomPresence = async (code: string, name: string): Promise<string> => {
    const uid = await getLocalUid();
    const ref = roomRef(code);
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

  /** Removes a player from the room. Security rules only let the room's host remove someone
   * else's entry — a non-host can only add/rename its own. */
  const removeRoomPlayer = (code: string, uid: string): Promise<void> =>
    updateDoc(roomRef(code), { [`players.${uid}`]: deleteField() });

  /** Host-only: deletes the room outright — used when the host quits, so joiners see it vanish
   * (`subscribeToRoomPlayers`'s `exists` flag going false) instead of being stuck on a room that
   * will never advance again. */
  const deleteRoom = (code: string): Promise<void> => deleteDoc(roomRef(code));

  /** "I'm still here": bumps this device's own `lastSeen`. The promise only settles once the server
   * acknowledged the write, so a device that can't reach it never sees it resolve — that's how
   * `useRoomPresence` notices its own connection dropping. Covered by the same "own `players` entry"
   * rule as `joinRoomPresence`. */
  const sendHeartbeat = (code: string, uid: string): Promise<void> =>
    updateDoc(roomRef(code), { [`players.${uid}.lastSeen`]: serverTimestamp() });

  /** Host-only: erases what players who left the room still have in the round data — one entry per uid
   * in each given map (`guesses`, `scores`, `totalScores`...), see `useHostPruneLeavers`. */
  const pruneRoomPlayerData = (code: string, stale: Record<string, string[]>): Promise<void> => {
    const updates = Object.fromEntries(
      Object.entries(stale).flatMap(([field, uids]) => uids.map((uid) => [`${field}.${uid}`, deleteField()])),
    );
    return Object.keys(updates).length === 0 ? Promise.resolve() : updateDoc(roomRef(code), updates);
  };

  /** Host-only: hands the turn to `uid` — turn-based games only (see `useHostTurnRecovery`). */
  const passRoomTurn = (code: string, uid: string): Promise<void> => updateDoc(roomRef(code), { turnUid: uid });

  /** Host-only: writes a `color` for one or more players at once (the host recomputing everyone's
   * color from scratch whenever the connected-players list changes). A no-op on an empty map
   * (Firestore rejects a field-less update). */
  const updateRoomPlayerColors = (code: string, colorByUid: Record<string, string>): Promise<void> => {
    const entries = Object.entries(colorByUid).map(([uid, color]) => [`players.${uid}.color`, color]);
    return entries.length === 0 ? Promise.resolve() : updateDoc(roomRef(code), Object.fromEntries(entries));
  };

  /** Live connected-players map for a room (keyed by uid) plus its host's uid, until unsubscribed
   * — the host uid lets the UI mark that entry. `exists` is false once the room itself is gone
   * (host started a new one — see `deletePreviousRoomsByHost`), so a joiner can tell "the room was
   * deleted" apart from "everyone but me left". `screen` (which screen the room is showing, the
   * implicit default `'options'` until the host starts the game) is included here too, rather than
   * its own listener on the same doc, purely so the setup screen — which already holds this
   * subscription open for the players list — can notice the game starting and navigate everyone
   * across. */
  const subscribeToRoomPlayers = <Screen extends string>(
    code: string,
    onUpdate: (players: RoomPlayers, hostUid: string | undefined, exists: boolean, screen: Screen) => void,
  ): (() => void) =>
    onSnapshot(roomRef(code), (snapshot) => {
      const data = snapshot.data();
      onUpdate(
        (data?.players as RoomPlayers | undefined) ?? {},
        data?.hostUid as string | undefined,
        snapshot.exists(),
        (data?.screen as Screen | undefined) ?? ('options' as Screen),
      );
    });

  return {
    roomRef,
    createRoom,
    roomExists,
    updateRoomSettings,
    subscribeToRoomSettings,
    joinRoomPresence,
    removeRoomPlayer,
    deleteRoom,
    pruneRoomPlayerData,
    sendHeartbeat,
    passRoomTurn,
    updateRoomPlayerColors,
    subscribeToRoomPlayers,
  };
};
