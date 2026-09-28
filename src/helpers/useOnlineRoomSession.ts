import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { RoomStoreHook } from './createRoomStore';
import { onlinePlayersFrom } from './roomPlayers';

/**
 * What every game's online screen needs about the room it's in, identical for all of them: the
 * live room state read from the game's shared store (never connected/disconnected here — the setup
 * screen owns that lifecycle, see `useSetupRoom`), who's the host, the arrival-ordered players, the
 * "room deleted" redirect, and `handleQuit`. `roomApi` is the game's own Firestore helpers.
 */
export const useOnlineRoomSession = <Settings, GameState>(
  store: RoomStoreHook<Settings, GameState>,
  roomApi: {
    deleteRoom: (code: string) => Promise<void>;
    removeRoomPlayer: (code: string, uid: string) => Promise<void>;
  },
  code: string,
  onQuit: () => void,
) => {
  const router = useRouter();

  const localUid = store((s) => s.localUid);
  const players = store((s) => s.players);
  const hostUid = store((s) => s.hostUid);
  const roomExists = store((s) => s.roomExists);
  const connectionLost = store((s) => s.connectionLost);
  // False once this device has left the room's store (the host quitting: see `handleQuit`).
  const connected = store((s) => s.code !== null);
  const roomSettings = store((s) => s.roomSettings);
  const gameState = store((s) => s.gameState);

  // Once the room itself has disappeared (the host quit/deleted it — see `handleQuit` below),
  // every other device freezes on the round it was in, under a "the host left" notice (shown by
  // `useSetupRoom`, which also sends it home on a tap) instead of carrying on with whatever stale
  // state its last snapshot left behind — this is the fallback if that hasn't: straight to the home
  // screen, not just "back" (the setup screen would still show this same, now-gone room).
  useEffect(() => {
    if (roomExists && !connectionLost) return;
    const timeout = setTimeout(() => router.dismissTo('/'), 2000);
    return () => clearTimeout(timeout);
  }, [roomExists, connectionLost, router]);

  const onlinePlayers = onlinePlayersFrom(players);
  const isHost = localUid !== null && localUid === hostUid;

  // Host: quitting takes the whole room down with it (everyone else sees the room-deleted notice
  // above) — there's no "pass the host" concept here, and there's nothing left to go "back" to
  // (the setup screen would still be sitting on this same, now-deleted room, since `push`ing to
  // the game route never popped it off the stack), so home directly rather than `onQuit` — with
  // `dismissTo`, which pops the game *and* that setup screen: a plain `replace('/')` only swapped
  // the game route, leaving the old setup instance mounted (and, with its old room's state, reacting
  // to the next game's room in the shared store — the "preparation" splash coming back after a
  // second quit). Also
  // disconnects the shared store right here rather than leaving it to that same setup screen's own
  // connect/disconnect effect: that effect only reacts to its `connectedRoomCode` changing, which
  // it never will on its own — without this, the store stays parked on the now-deleted room (stale
  // `code`/`gameState.screen`), and its own "go to the game once the host starts a round" effect
  // fires again the next time that stale screen re-renders, right back into a room that no longer
  // exists. A joiner just drops its own presence instead, so it doesn't keep blocking the round
  // for everyone else — going back to the setup screen still makes sense there, the room is still
  // very much alive.
  const handleQuit = () => {
    if (isHost) {
      roomApi.deleteRoom(code).catch(() => {});
      store.getState().disconnect();
      router.dismissTo('/');
      return;
    }
    if (localUid !== null) {
      // Marked *before* the write goes out: the setup screen's own "was I kicked?" listener reacts
      // to the same players update this produces, and can't otherwise tell "I just quit" apart
      // from "the host removed me" — both look identical in Firestore (present, then not).
      store.getState().markVoluntaryLeave();
      roomApi.removeRoomPlayer(code, localUid).catch(() => {});
    }
    onQuit();
  };

  return {
    localUid,
    players,
    hostUid,
    connectionLost,
    connected,
    roomSettings,
    gameState,
    onlinePlayers,
    isHost,
    handleQuit,
  };
};
