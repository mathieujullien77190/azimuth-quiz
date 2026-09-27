import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { NAME_PLACEHOLDERS, PLAYER_COLORS } from '@/data';
import { ROOM_PLAYER_COLORS } from '@/games/compass/constants';
import { pickPlaces, resolveOrigin } from '@/helpers';
import {
  ROOM_MAX_PLAYERS,
  createRoom,
  deleteRoom,
  isValidRoomCode,
  joinRoomPresence,
  removeRoomPlayer,
  roomExists,
  roomSettingsFrom,
  startRoomGame,
  updateRoomPlayerColors,
  updateRoomSettings,
} from '@/games/compass/helpers/room';
import { useRoomStore } from '@/games/compass/store/roomStore';
import { useLanguage, useTranslation } from '@/i18n';
import type { GameSettings } from '@/types';

/** All the online-room business logic behind `SetupScreen` — state, every Firestore effect,
 * derived values and already-resolved actions. `SetupScreen` (smart) calls this and maps its
 * return straight onto `SetupScreenView` (dumb) props; nothing here renders anything. */
export const useOnlineRoom = (settings: GameSettings, updateSettings: (patch: Partial<GameSettings>) => void) => {
  const router = useRouter();
  const t = useTranslation();
  const { language } = useLanguage();
  const soloName = settings.playerNames[0] ?? '';
  // Fixed order (same name always at the same field) rather than randomized per load.
  const soloPlaceholder = NAME_PLACEHOLDERS[0];

  // Host/join is purely local UI state, not a saved preference — a fresh host/join happens
  // every time this screen is opened. Joining shows every setting section read-only (mirroring
  // the host's live settings via `roomSettings` below) rather than hiding them.
  const [onlineChoice, setOnlineChoice] = useState<'host' | 'join' | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const readOnly = onlineChoice === 'join';

  // Leaving host mode (Solo or switching to Join) takes the room down with it, same as
  // `handleQuit` mid-game: there's no "pass the host" concept, and otherwise the room stays
  // orphaned in Firestore forever (`removeRoomPlayer` on the way out, below, only ever drops this
  // device's own presence — a leftover doc with no host is what let a joiner "reconnect" to a
  // room its creator had already walked away from).
  const leaveHostedRoom = () => {
    if (onlineChoice === 'host' && roomCode !== null) deleteRoom(roomCode).catch(() => {});
  };

  const chooseSolo = () => {
    leaveHostedRoom();
    setOnlineChoice(null);
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  };

  const chooseHost = () => {
    setOnlineChoice('host');
    setRoomCode(null);
    createRoom(roomSettingsFrom(settings)).then(setRoomCode);
  };

  const chooseJoin = () => {
    leaveHostedRoom();
    setOnlineChoice('join');
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  };

  // Host: every settings change gets pushed to the room so joiners watching it stay in sync.
  // Swallows a failure (e.g. this room got deleted from under it — `deletePreviousRoomsByHost`)
  // rather than let an unhandled rejection crash the screen with a raw Firestore error: nothing
  // reads this promise's result, so there's nothing useful to do with the error here anyway.
  useEffect(() => {
    if (onlineChoice !== 'host' || roomCode === null) return;
    updateRoomSettings(roomCode, roomSettingsFrom(settings)).catch(() => {});
  }, [onlineChoice, roomCode, settings]);

  // Join: once a well-formed code is typed, a one-shot check decides whether it's valid — checked
  // against the room code's own consonant+vowel shape, not just its length, so a typo never fires
  // a Firestore lookup (and the "code not found" message) for something that could never be a real
  // code. Applying the host's settings to this device's own, once actually connected, is a
  // separate effect below (mirroring `useRoomStore`'s `roomSettings`) — not folded in here, so
  // there's only ever one `subscribeToRoomSettings` open per room (this effect used to open its
  // own, on top of the shared store's, once a code validated).
  useEffect(() => {
    if (onlineChoice !== 'join') return;
    const code = joinCode.trim().toLowerCase();
    if (!isValidRoomCode(code)) return;

    let cancelled = false;
    roomExists(code)
      .then((exists) => {
        if (!cancelled) setJoinStatus(exists ? 'valid' : 'invalid');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [onlineChoice, joinCode]);

  // Code this device is currently connected to (as host or as a validated joiner) — null while
  // just browsing the host/join chips with nothing confirmed yet.
  const connectedRoomCode =
    onlineChoice === 'host'
      ? roomCode
      : onlineChoice === 'join' && joinStatus === 'valid'
        ? joinCode.trim().toLowerCase()
        : null;

  // Host's "Lancer la partie": picks the origin and the whole game's places exactly like the
  // local solo/same-device game does (`useGame.start()`) — the host's own GPS/custom position,
  // never a joiner's, is the shared reference every guess gets scored against (see
  // `startRoomGame`). Writing it is enough: every device (host included) reacts to `screen`
  // turning `'game'` via the effect above and navigates itself. `starting` covers the gap in
  // between (GPS resolution, then the Firestore write/round-trip) with a loading screen — reset
  // only on failure, since success is followed by leaving this screen entirely.
  const [starting, setStarting] = useState(false);
  const startOnlineGame = async () => {
    if (connectedRoomCode === null) return;
    setStarting(true);
    const origin = settings.useGps
      ? await resolveOrigin(t.common.yourPosition)
      : {
          name: t.common.yourPosition,
          coordinates: { latitude: settings.customLatitude, longitude: settings.customLongitude },
          isDevicePosition: false,
        };
    const places = pickPlaces(origin.coordinates, settings, language);
    await startRoomGame(connectedRoomCode, { origin, places }).catch(() => setStarting(false));
  };

  // Shared with `OnlineGameScreen`, which only ever reads it — this screen alone owns the
  // connect/disconnect lifecycle (see `useRoomStore`'s own comment), since it's always the one
  // that establishes a room before anyone can navigate to `/online-game`.
  const players = useRoomStore((s) => s.players);
  const hostUid = useRoomStore((s) => s.hostUid);
  const localUid = useRoomStore((s) => s.localUid);
  const roomSettings = useRoomStore((s) => s.roomSettings);
  const roomScreen = useRoomStore((s) => s.gameState.screen);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    useRoomStore.getState().connect(connectedRoomCode);
    return () => useRoomStore.getState().disconnect();
  }, [connectedRoomCode]);

  // Mirrors the host's settings onto this device's own, for a joiner (read-only display) — the
  // single `subscribeToRoomSettings` opened by `connect()` above already keeps `roomSettings`
  // current, this just applies it whenever it changes.
  useEffect(() => {
    if (onlineChoice !== 'join' || roomSettings === null) return;
    updateSettings(roomSettings);
  }, [onlineChoice, roomSettings, updateSettings]);

  // Registers this device in the room's connected-players list, for both host and joiner — the
  // name field locks once connected (see `SetupScreenView`'s `editable`), so in practice this
  // only ever fires once per room, but still keys off `soloName` rather than a snapshot of it
  // taken at connect time, in case that ever changes. Swallows a failure (e.g. this room was just
  // deleted from under it — see the comment on the cleanup effect right below) instead of an
  // unhandled rejection crashing the screen.
  useEffect(() => {
    if (connectedRoomCode === null) return;
    joinRoomPresence(connectedRoomCode, soloName.trim() || soloPlaceholder)
      .then((uid) => useRoomStore.setState({ localUid: uid }))
      .catch(() => {});
  }, [connectedRoomCode, soloName, soloPlaceholder]);

  // Leaves the *previous* room when switching to a different one (or leaving this screen) —
  // otherwise it stays parked there forever, still listing a host nobody will ever come back to
  // (see `leaveHostedRoom`'s own comment: this is the same problem, just via unmount — e.g. the
  // "Retour" button — rather than the Solo/Join chips, which already delete it themselves before
  // this cleanup even runs). The host deletes the room outright, same as `handleQuit` mid-game;
  // a joiner just drops its own presence, so it doesn't keep blocking the room for everyone else.
  // Deliberately its own effect, not folded into the one above: it must only fire on an actual
  // room change, not on a rename (which can't happen post-connect any more, but the effect still
  // shouldn't conflate the two). Swallowed: this fires for a joiner right after the "room
  // deleted" reset too (`onlineChoice` going back to null makes `connectedRoomCode` null), by
  // which point the room is already gone and Firestore's rules reject the write on a nonexistent
  // doc as "permission denied" — nothing to do about it, we're leaving anyway.
  useEffect(() => {
    if (connectedRoomCode === null || localUid === null) return;
    const isHostOfThisRoom = localUid === hostUid;
    return () => {
      if (isHostOfThisRoom) deleteRoom(connectedRoomCode).catch(() => {});
      else removeRoomPlayer(connectedRoomCode, localUid).catch(() => {});
    };
  }, [connectedRoomCode, localUid, hostUid]);

  // Two ways of getting disconnected — subscribed directly to the store (not a `useEffect` reading
  // its already-selected values: setting state straight from a dependency-array-driven effect is
  // "derived state", the anti-pattern `react-hooks/set-state-in-effect` flags; a genuine external
  // subscription callback, same shape as the old direct Firestore one this replaces, isn't). Once
  // we've seen our own uid in `players`, its later absence means the host used `removeRoomPlayer`
  // on us (never mistaken for "haven't joined yet", which only ever goes the other way — absent →
  // present); and the room itself disappearing (the host started a new one —
  // `deletePreviousRoomsByHost`) is its own case, only shown to a joiner, since the host is the one
  // causing it.
  const [disconnectReason, setDisconnectReason] = useState<'kicked' | 'deleted' | null>(null);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    let hasBeenPresent = false;
    return useRoomStore.subscribe((state) => {
      if (!state.roomExists) {
        if (onlineChoice === 'join') setDisconnectReason('deleted');
        return;
      }
      if (state.localUid === null) return;
      if (state.localUid in state.players) hasBeenPresent = true;
      else if (hasBeenPresent) setDisconnectReason('kicked');
    });
  }, [connectedRoomCode, onlineChoice]);

  // The host starting the game (see `startOnlineGame`) flips `screen` to 'game' for every
  // connected device — host included, its own subscription above sees the same change — so this
  // single effect moves everyone across, rather than the host navigating itself separately.
  useEffect(() => {
    if (roomScreen === 'options' || connectedRoomCode === null) return;
    router.push({ pathname: '/online-game', params: { code: connectedRoomCode } });
  }, [roomScreen, connectedRoomCode, router]);

  // Auto-dismissed like `readOnlyNotice` below, but also drops back out of the room afterwards —
  // there's nothing left to stay connected to. Factored out so a tap on the notice itself
  // (`dismissDisconnectNotice`, wired below) can run the exact same reset early.
  const dismissDisconnectNotice = () => {
    setDisconnectReason(null);
    setOnlineChoice(null);
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  };
  useEffect(() => {
    if (disconnectReason === null) return;
    const timeout = setTimeout(dismissDisconnectNotice, 2000);
    return () => clearTimeout(timeout);
  }, [disconnectReason]);

  // Guarded on `connectedRoomCode` rather than reset to `{}` on leaving it: stale entries from
  // the last room just never render once disconnected, without a synchronous setState in the
  // effect above. Also guarded on `localUid`: the players snapshot can arrive before
  // `joinRoomPresence` has resolved our own uid (it's a separate, unsequenced effect), and
  // without it we can't tell our own entry apart from everyone else's — better to show nothing
  // for a moment than to flash ourselves twice (once as our own input, once misidentified as
  // "another player").
  const connectedPlayerEntries =
    connectedRoomCode === null || localUid === null
      ? []
      : Object.entries(players)
          // A brand-new entry reads back as `joinedAt: null` on the device that just wrote it,
          // until its `serverTimestamp()` round-trips — sorted last (its real arrival slot), not
          // first, so a joiner never briefly jumps to the top of its own list.
          .sort(([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity))
          .slice(0, ROOM_MAX_PLAYERS);
  const isHost = localUid !== null && localUid === hostUid;
  // Solo play keeps the fixed local-multiplayer red — once connected, this device's own badge
  // reflects whatever color the host assigned it too, same as everyone else's.
  const soloColor =
    connectedRoomCode !== null && localUid !== null
      ? (players[localUid]?.color ?? ROOM_PLAYER_COLORS[0])
      : PLAYER_COLORS[0];

  // Host-only: whenever who's connected changes (join/leave/kick), recompute everyone's color
  // from scratch by arrival order and write it back — joiners never compute their own colors,
  // they just read whatever's stored (see `RoomPlayer.color`), so every device always agrees.
  useEffect(() => {
    if (!isHost || connectedRoomCode === null) return;
    const sorted = Object.entries(players).sort(
      ([, a], [, b]) => (a.joinedAt?.toMillis() ?? Infinity) - (b.joinedAt?.toMillis() ?? Infinity),
    );
    const colorByUid: Record<string, string> = {};
    sorted.forEach(([uid, player], index) => {
      const color = ROOM_PLAYER_COLORS[index % ROOM_PLAYER_COLORS.length];
      if (player.color !== color) colorByUid[uid] = color;
    });
    updateRoomPlayerColors(connectedRoomCode, colorByUid).catch(() => {});
  }, [isHost, connectedRoomCode, players]);

  // Read-only sections still react to a tap/toggle, but only to explain why nothing happened —
  // auto-dismissed a couple seconds later (the `setTimeout` callback below runs outside the
  // effect's own synchronous body, same as any other async completion).
  const [readOnlyNotice, setReadOnlyNotice] = useState(false);
  useEffect(() => {
    if (!readOnlyNotice) return;
    const timeout = setTimeout(() => setReadOnlyNotice(false), 2000);
    return () => clearTimeout(timeout);
  }, [readOnlyNotice]);
  const notifyReadOnly = () => setReadOnlyNotice(true);
  const overlayMessage =
    disconnectReason === 'kicked'
      ? t.setup.online.kickedNotice
      : disconnectReason === 'deleted'
        ? t.setup.online.roomDeletedNotice
        : readOnlyNotice
          ? t.setup.readOnlyNotice
          : null;
  // Tapping the notice dismisses whichever one is showing early, instead of only ever waiting
  // out its own 2s auto-dismiss timeout above.
  const dismissOverlay = () => {
    if (disconnectReason !== null) dismissDisconnectNotice();
    else setReadOnlyNotice(false);
  };

  return {
    soloName,
    soloPlaceholder,
    onlineChoice,
    roomCode,
    joinCode,
    setJoinCode,
    // Pre-resolved rather than making `SetupScreenView` import `isValidRoomCode` itself: that
    // pulls in `room.ts`, which imports `firebase/firestore` at module scope — fine for the
    // container, but exactly what the dumb view must never transitively depend on.
    joinCodeIsValid: isValidRoomCode(joinCode.trim().toLowerCase()),
    joinStatus,
    readOnly,
    starting,
    connectedRoomCode,
    connectedPlayers: connectedPlayerEntries,
    localUid,
    hostUid,
    isHost,
    soloColor,
    overlayMessage,
    dismissOverlay,
    chooseSolo,
    chooseHost,
    chooseJoin,
    kick: (uid: string) => {
      if (connectedRoomCode === null) return;
      removeRoomPlayer(connectedRoomCode, uid).catch(() => {});
    },
    notifyReadOnly,
    startOnlineGame,
  };
};
