import { useEffect, useRef } from 'react';

import type { RoomPlayers } from './roomBase';

// Deliberately slow and cheap: every heartbeat is a Firestore write that every connected player then
// reads too (N players => N reads per write), so this dominates the room's traffic. 30s beats with a
// 90s threshold keep a 4-player hour around 500 writes / 2000 reads, and nothing is sent at all
// alone or in the lobby (see `active`).
const HEARTBEAT_MS = 30_000;
const LOST_AFTER_MS = 90_000;
const CHECK_MS = 10_000;
/** A check running this much later than scheduled means the device itself was suspended (app in the
 * background, screen locked...) and no timer ran: not a network loss, restart the baselines. */
const SUSPENDED_GAP_MS = CHECK_MS * 3;

type PresenceState = {
  localUid: string | null;
  hostUid: string | null;
  players: RoomPlayers;
  gameState: { screen: string };
  markConnectionLost: () => void;
};

type PresenceStore = {
  <U>(selector: (state: PresenceState) => U): U;
  getState: () => PresenceState;
};

type PresenceApi = {
  sendHeartbeat: (code: string, uid: string) => Promise<void>;
  deleteRoom: (code: string) => Promise<void>;
  removeRoomPlayer: (code: string, uid: string) => Promise<void>;
};

/**
 * Connection-loss detection, identical for every game — mounted once, by `useSetupRoom`, which stays
 * alive under the game screen for the whole life of the room. While a game is running with more than
 * one player, each device writes a heartbeat (`lastSeen`) and everyone watches the others' (whether
 * it changed lately — never compared to a local clock, which can be skewed). Nobody tries to recover
 * anything: whoever loses the connection just leaves the game.
 *
 * - This device's own heartbeat never gets acknowledged by the server for too long: it's offline,
 *   marks `connectionLost` (screens show a notice and head home) and leaves the room — the host
 *   deleting it, a joiner dropping out (both queued by Firestore until it's back, if ever).
 * - The host stops seeing a joiner's heartbeat: it removes that joiner (the turn-based games then
 *   hand the turn on, see `useHostTurnRecovery`); the others keep playing.
 * - A joiner stops seeing the host's: with no host the game can't advance (it starts rounds and
 *   writes scores), same outcome as the host quitting — the joiner leaves.
 */
export const useRoomPresence = (store: PresenceStore, api: PresenceApi, code: string | null) => {
  const localUid = store((s) => s.localUid);
  const screen = store((s) => s.gameState.screen);
  const playerCount = store((s) => Object.keys(s.players).length);
  const active = code !== null && localUid !== null && screen === 'game' && playerCount > 1;

  const lastAckRef = useRef(0);
  const lastCheckRef = useRef(0);
  const seenRef = useRef(new Map<string, { value: number | null; at: number }>());

  // This device's own heartbeat. Resolving means the server got it — that's the only "am I online?"
  // signal there is (a rejected write, e.g. the room is gone, doesn't count).
  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const beat = () =>
      api
        .sendHeartbeat(code, localUid)
        .then(() => {
          lastAckRef.current = Date.now();
        })
        .catch(() => {});
    lastAckRef.current = Date.now();
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, api]);

  useEffect(() => {
    if (!active || code === null || localUid === null) return;
    const seen = seenRef.current;
    seen.clear();
    lastCheckRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastCheckRef.current > SUSPENDED_GAP_MS) {
        lastCheckRef.current = now;
        lastAckRef.current = now;
        seen.clear();
        return;
      }
      lastCheckRef.current = now;

      const state = store.getState();
      const isHost = localUid === state.hostUid;
      let hostSilent = false;
      const silentJoiners: string[] = [];
      for (const [uid, player] of Object.entries(state.players)) {
        if (uid === localUid) continue;
        const value = player.lastSeen?.toMillis() ?? null;
        const previous = seen.get(uid);
        if (!previous || previous.value !== value) {
          seen.set(uid, { value, at: now });
        } else if (now - previous.at > LOST_AFTER_MS) {
          if (uid === state.hostUid) hostSilent = true;
          else silentJoiners.push(uid);
        }
      }
      for (const uid of seen.keys()) if (!(uid in state.players)) seen.delete(uid);

      if (now - lastAckRef.current > LOST_AFTER_MS || (!isHost && hostSilent)) {
        state.markConnectionLost();
        if (isHost) api.deleteRoom(code).catch(() => {});
        else api.removeRoomPlayer(code, localUid).catch(() => {});
        return;
      }
      if (isHost) {
        silentJoiners.forEach((uid) => {
          seen.delete(uid);
          api.removeRoomPlayer(code, uid).catch(() => {});
        });
      }
    }, CHECK_MS);
    return () => clearInterval(interval);
  }, [active, code, localUid, store, api]);
};
