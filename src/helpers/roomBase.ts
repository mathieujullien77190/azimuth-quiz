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
import { generateRoomCode, getLocalUid, loadMyRoomCode, saveMyRoomCode } from '@/helpers/roomCode';
import { isNameTaken, nameTakenError } from '@/helpers/roomName';

// Not re-exported from `helpers/index.ts`'s barrel: `firebase/firestore` is ESM-only and crashes
// Jest the moment anything requires it transitively (see `helpers/firebase.ts`'s own note) —
// keeping this out of the barrel means only whatever actually calls into Firestore pays that
// cost, not every test that imports `@/helpers` for something unrelated.
//
// Everything about an online room that has no game-specific coupling — lifecycle (create/join/
// leave/delete), presence, player colors, settings sync — written once and bound to a game: every
// game's rooms live in the one `rooms` collection, told apart by their immutable `game` field
// (`createRoomApi('compass')`, `'clues'`, `'silhouette'`).
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

/** The games that have online rooms: the value of a room's `game` field, set when it is created and never
 * changed (the Firestore rules refuse it). */
export type RoomGame = 'compass' | 'clues' | 'silhouette';

/** Every game's rooms share this one collection. */
const ROOMS_COLLECTION = 'rooms';

export const createRoomApi = <Settings extends object>(game: RoomGame) => {
  const roomRef = (code: string) => doc(db, ROOMS_COLLECTION, code);

  /** Deletes every room this uid previously hosted — called right before creating a new one, so a
   * host never accumulates abandoned rooms every time it starts a fresh game — whichever game they were
   * for: a host has one room at a time. */
  const deletePreviousRoomsByHost = async (hostUid: string): Promise<void> => {
    const snapshot = await getDocs(query(collection(db, ROOMS_COLLECTION), where('hostUid', '==', hostUid)));
    await Promise.all(snapshot.docs.map((roomDoc) => deleteDoc(roomDoc.ref)));
  };

  /** Creates a new room, under the code this device hosted last when it is still free (the player keeps
   * their code across games and parties), else under a fresh one, retrying on the rare collision with an existing one,
   * seeded with the host's current settings and stamped with its uid and its game — security rules
   * only let that same uid update the room's settings afterwards, and nobody change the game. Returns the code that ended up winning.
   * First clears out any room this uid hosted before (see `deletePreviousRoomsByHost`). */
  const createRoom = async (settings: Settings): Promise<string> => {
    const hostUid = await getLocalUid();
    await deletePreviousRoomsByHost(hostUid);
    let remembered = await loadMyRoomCode();
    for (;;) {
      const code = remembered ?? generateRoomCode();
      remembered = null;
      const ref = roomRef(code);
      if ((await getDoc(ref)).exists()) continue;

      await setDoc(ref, { createdAt: serverTimestamp(), hostUid, game, settings });
      await saveMyRoomCode(code);
      return code;
    }
  };

  /** Whether a room of *this game* with this code currently exists (join flow: validate before moving
   * on). A code that belongs to another game's room doesn't count: joining it from here would land in
   * a game this screen can't play. */
  const roomExists = async (code: string): Promise<boolean> => {
    const snapshot = await getDoc(roomRef(code));
    return snapshot.exists() && snapshot.data()?.game === game;
  };

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
   * `ROOM_MAX_PLAYERS` distinct players, for a device that isn't already one of them. Throws (see
   * `isNameTakenError`) when another player already has the name. Only ever
   * touches this player's own `name`/`joinedAt`, each its own field path — never `color`, not even to preserve it: writing
   * `players.{uid}` as a whole (replacing the nested map in one shot) would otherwise wipe out
   * whatever color the host already assigned there. */
  const joinRoomPresence = async (code: string, name: string): Promise<string> => {
    const uid = await getLocalUid();
    const ref = roomRef(code);
    const players = ((await getDoc(ref)).data()?.players as RoomPlayers | undefined) ?? {};
    const existing = players[uid];
    if (existing || Object.keys(players).length < ROOM_MAX_PLAYERS) {
      // Two players can't share a name: the newcomer is refused and picks another (the screen says so).
      if (isNameTaken(name, players, uid)) throw nameTakenError();
      await updateDoc(ref, {
        [`players.${uid}.name`]: name,
        [`players.${uid}.joinedAt`]: existing?.joinedAt ?? serverTimestamp(),
      });
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

  /** Host-only: sends the room back to its lobby (`screen: 'options'`) with everyone still in it: the "replay" of the
   * end screen. Nothing else is touched — the next start (each game's `startRoomGame`) rewrites every round field. */
  const restartRoom = (code: string): Promise<void> => updateDoc(roomRef(code), { screen: 'options' });

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
    restartRoom,
    pruneRoomPlayerData,
    sendHeartbeat,
    passRoomTurn,
    updateRoomPlayerColors,
    subscribeToRoomPlayers,
  };
};
