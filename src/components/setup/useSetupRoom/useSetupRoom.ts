import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NAME_PLACEHOLDERS, PLAYER_COLORS } from '@/data';
import { playersByArrival } from '@/helpers/roomPlayers';
import { useRoomPresence } from '@/helpers/useRoomPresence';
import { useTranslation } from '@/i18n';

import type { SetupPartyProps, SetupRoomAdapter } from './types';

/**
 * All the online-room business logic behind a game's setup screen, identical for every game —
 * state, every Firestore effect, derived values and already-resolved actions. Each game plugs its
 * own collection/store in through `adapter` (see `SetupRoomAdapter`); the container calls this and
 * hands `party` straight to `SetupScreenShell`, nothing here renders anything. Only starting the
 * game differs per game: see `startOnlineGame`.
 */
export const useSetupRoom = <S extends { playerNames: string[] }, R extends Partial<S>>(
  adapter: SetupRoomAdapter<S, R>,
  settings: S,
  updateSettings: (patch: Partial<S>) => void,
) => {
  const { store } = adapter;
  const router = useRouter();
  const t = useTranslation();
  const soloName = settings.playerNames[0] ?? '';
  // Fixed order (same name always at the same field) rather than randomized per load.
  const soloPlaceholder = NAME_PLACEHOLDERS[0];

  // Host/join is purely local UI state, not a saved preference — a fresh host/join happens
  // every time this screen is opened. Joining shows every setting section read-only (mirroring
  // the host's live settings via `roomSettings` below) rather than hiding them.
  //
  // There is no local, single-device game: playing alone is hosting a room nobody else joins. "Solo"
  // (`onlineChoice === null`) just doesn't show it — `hostedSilently` is the room `startOnlineGame`
  // creates behind the scenes when "Lancer la partie" is pressed, hosted exactly like a visible one
  // (`mode`) but never shown to the player (no code, the chips keep saying Solo).
  const [onlineChoice, setOnlineChoice] = useState<'host' | 'join' | null>(null);
  const [hostedSilently, setHostedSilently] = useState(false);
  const mode = hostedSilently ? 'host' : onlineChoice;
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const readOnly = mode === 'join';

  // Leaving host mode (Solo or switching to Join) takes the room down with it, same as
  // `handleQuit` mid-game: there's no "pass the host" concept, and otherwise the room stays
  // orphaned in Firestore forever (`removeRoomPlayer` on the way out, below, only ever drops this
  // device's own presence — a leftover doc with no host is what let a joiner "reconnect" to a
  // room its creator had already walked away from).
  const leaveHostedRoom = () => {
    if (mode === 'host' && roomCode !== null) adapter.deleteRoom(roomCode).catch(() => {});
  };

  const resetChoice = useCallback(() => {
    setOnlineChoice(null);
    setHostedSilently(false);
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  }, []);

  const chooseSolo = () => {
    leaveHostedRoom();
    resetChoice();
  };

  const chooseHost = () => {
    // A room is already up (solo's, after a failed start): show it instead of making a second one.
    if (hostedSilently) {
      setOnlineChoice('host');
      setHostedSilently(false);
      return;
    }
    setOnlineChoice('host');
    setRoomCode(null);
    adapter.createRoom(adapter.roomSettingsFrom(settings)).then(setRoomCode);
  };

  const chooseJoin = () => {
    leaveHostedRoom();
    setOnlineChoice('join');
    setHostedSilently(false);
    setRoomCode(null);
    setJoinCode('');
    setJoinStatus('idle');
  };

  // Host: every settings change gets pushed to the room so joiners watching it stay in sync.
  // Swallows a failure (e.g. this room got deleted from under it — `deletePreviousRoomsByHost`)
  // rather than let an unhandled rejection crash the screen with a raw Firestore error: nothing
  // reads this promise's result, so there's nothing useful to do with the error here anyway.
  useEffect(() => {
    if (mode !== 'host' || roomCode === null) return;
    adapter.updateRoomSettings(roomCode, adapter.roomSettingsFrom(settings)).catch(() => {});
  }, [adapter, mode, roomCode, settings]);

  // Join: once a well-formed code is typed, a one-shot check decides whether it's valid — checked
  // against the room code's own consonant+vowel shape, not just its length, so a typo never fires
  // a Firestore lookup (and the "code not found" message) for something that could never be a real
  // code. Applying the host's settings to this device's own, once actually connected, is a
  // separate effect below (mirroring the store's `roomSettings`) — not folded in here, so
  // there's only ever one `subscribeToRoomSettings` open per room.
  useEffect(() => {
    if (mode !== 'join') return;
    const code = joinCode.trim().toLowerCase();
    if (!adapter.isValidRoomCode(code)) return;

    let cancelled = false;
    adapter
      .roomExists(code)
      .then((exists) => {
        if (!cancelled) setJoinStatus(exists ? 'valid' : 'invalid');
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [adapter, mode, joinCode]);

  // Code this device is currently connected to (as host or as a validated joiner) — null while
  // just browsing the host/join chips with nothing confirmed yet.
  const connectedRoomCode =
    mode === 'host' ? roomCode : mode === 'join' && joinStatus === 'valid' ? joinCode.trim().toLowerCase() : null;

  // "Lancer la partie": each game decides what to write (origin, places, first turn...) in `run`,
  // this only owns the connected-room guard and the `starting` loading state covering the gap
  // in between (GPS resolution, then the Firestore write/round-trip) — reset only on failure,
  // since success is followed by leaving this screen entirely. Every device (host included)
  // then reacts to the room's `screen` turning `'game'` (effect below) and navigates itself.
  //
  // Solo has no room yet: one is created here, silently, and `run` waits (`pendingRun`, fired by the
  // effect below) until it's connected and this device is registered in it — `run` may need the
  // room's own state (who's first in arrival order...), which only exists once that's the case.
  const [starting, setStarting] = useState(false);
  const pendingRunRef = useRef<((code: string) => Promise<void>) | null>(null);
  const startOnlineGame = async (run: (code: string) => Promise<void>) => {
    if (connectedRoomCode !== null) {
      setStarting(true);
      await run(connectedRoomCode).catch(() => setStarting(false));
      return;
    }
    if (mode === 'join') return;
    setStarting(true);
    try {
      const code = await adapter.createRoom(adapter.roomSettingsFrom(settings));
      pendingRunRef.current = run;
      setRoomCode(code);
      setHostedSilently(true);
    } catch {
      setStarting(false);
    }
  };

  // Shared with the game's online screen, which only ever reads it — this screen alone owns the
  // connect/disconnect lifecycle, since it's always the one that establishes a room before anyone
  // can navigate to the game route.
  const players = store((s) => s.players);
  const hostUid = store((s) => s.hostUid);
  const localUid = store((s) => s.localUid);
  const roomSettings = store((s) => s.roomSettings);
  const roomScreen = store((s) => s.gameState.screen);
  // The game screen took over (the room left its lobby): the start is done. This screen stays
  // mounted underneath it, and its loading splash is a modal that would otherwise stay on top of the
  // game — hence the reset, done while rendering (React's pattern for state derived from a value
  // that changed) rather than in an effect.
  if (starting && roomScreen !== 'options') setStarting(false);
  const connectionLost = store((s) => s.connectionLost);
  // Connection-loss detection for the whole life of the room (this screen stays mounted under the
  // game screen): see `useRoomPresence`. Whoever loses the connection just leaves the game.
  useRoomPresence(store, adapter, connectedRoomCode);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    store.getState().connect(connectedRoomCode);
    return () => store.getState().disconnect();
  }, [connectedRoomCode, store]);

  // Solo's deferred "Lancer la partie" (see `startOnlineGame`): fires once the silent room is
  // connected and this device shows up in it.
  useEffect(() => {
    const run = pendingRunRef.current;
    if (run === null || connectedRoomCode === null || localUid === null || !(localUid in players)) return;
    pendingRunRef.current = null;
    run(connectedRoomCode).catch(() => setStarting(false));
  }, [connectedRoomCode, localUid, players]);

  // Mirrors the host's settings onto this device's own, for a joiner (read-only display) — the
  // single `subscribeToRoomSettings` opened by `connect()` above already keeps `roomSettings`
  // current, this just applies it whenever it changes.
  useEffect(() => {
    if (mode !== 'join' || roomSettings === null) return;
    updateSettings(roomSettings);
  }, [mode, roomSettings, updateSettings]);

  // Registers this device in the room's connected-players list, for both host and joiner — the
  // name field locks once connected, so in practice this only ever fires once per room, but still
  // keys off `soloName` rather than a snapshot of it taken at connect time, in case that ever
  // changes. Swallows a failure (e.g. this room was just deleted from under it — see the cleanup
  // effect right below) instead of an unhandled rejection crashing the screen.
  useEffect(() => {
    if (connectedRoomCode === null) return;
    adapter
      .joinRoomPresence(connectedRoomCode, soloName.trim() || soloPlaceholder)
      .then((uid) => store.setState({ localUid: uid }))
      .catch(() => {});
  }, [adapter, connectedRoomCode, soloName, soloPlaceholder, store]);

  // Leaves the *previous* room when switching to a different one (or leaving this screen) —
  // otherwise it stays parked there forever, still listing a host nobody will ever come back to.
  // The host deletes the room outright, same as `handleQuit` mid-game; a joiner just drops its own
  // presence, so it doesn't keep blocking the room for everyone else. Deliberately its own effect:
  // it must only fire on an actual room change. Swallowed: this fires for a joiner right after the
  // "room deleted" reset too, by which point the room is already gone and Firestore's rules reject
  // the write on a nonexistent doc as "permission denied" — nothing to do, we're leaving anyway.
  useEffect(() => {
    if (connectedRoomCode === null || localUid === null) return;
    const isHostOfThisRoom = localUid === hostUid;
    return () => {
      if (isHostOfThisRoom) adapter.deleteRoom(connectedRoomCode).catch(() => {});
      else adapter.removeRoomPlayer(connectedRoomCode, localUid).catch(() => {});
    };
  }, [adapter, connectedRoomCode, localUid, hostUid]);

  // Two ways of getting disconnected — subscribed directly to the store (not a `useEffect` reading
  // its already-selected values: setting state straight from a dependency-array-driven effect is
  // "derived state", the anti-pattern `react-hooks/set-state-in-effect` flags; a genuine external
  // subscription callback isn't). Once we've seen our own uid in `players`, its later absence means
  // the host used `removeRoomPlayer` on us (never mistaken for "haven't joined yet", which only
  // ever goes the other way — absent → present); and the room itself disappearing (the host
  // started a new one — `deletePreviousRoomsByHost`) is its own case, only shown to a joiner,
  // since the host is the one causing it.
  const [disconnectReason, setDisconnectReason] = useState<'kicked' | 'deleted' | null>(null);
  // Auto-dismissed below, but also drops back out of the room afterwards — there's nothing left
  // to stay connected to.
  const dismissDisconnectNotice = useCallback(() => {
    setDisconnectReason(null);
    resetChoice();
  }, [resetChoice]);
  useEffect(() => {
    if (connectedRoomCode === null) return;
    let hasBeenPresent = false;
    return store.subscribe((state) => {
      if (!state.roomExists) {
        if (mode === 'join') setDisconnectReason('deleted');
        return;
      }
      if (state.localUid === null) return;
      if (state.localUid in state.players) hasBeenPresent = true;
      else if (hasBeenPresent) {
        // Quitting on purpose (the online screen's own handleQuit, non-host branch) removes this
        // device's own presence exactly the same way a real kick would — `consumeVoluntaryLeave`
        // is how it tells the two apart. No notice either way, just the same reset a dismissed
        // one leaves behind, since there's nothing to leave lingering in.
        if (store.getState().consumeVoluntaryLeave()) dismissDisconnectNotice();
        else setDisconnectReason('kicked');
      }
    });
  }, [connectedRoomCode, dismissDisconnectNotice, mode, store]);

  // The host starting the game flips `screen` to 'game' for every connected device — host
  // included, its own subscription above sees the same change — so this single effect moves
  // everyone across, rather than the host navigating itself separately.
  useEffect(() => {
    if (roomScreen === 'options' || connectedRoomCode === null) return;
    router.push({ pathname: adapter.gamePath, params: { code: connectedRoomCode } });
  }, [adapter.gamePath, roomScreen, connectedRoomCode, router]);

  useEffect(() => {
    if (disconnectReason === null && !connectionLost) return;
    const timeout = setTimeout(dismissDisconnectNotice, 2000);
    return () => clearTimeout(timeout);
  }, [disconnectReason, connectionLost, dismissDisconnectNotice]);

  // Guarded on `connectedRoomCode` rather than reset to `{}` on leaving it: stale entries from
  // the last room just never render once disconnected. Also guarded on `localUid`: the players
  // snapshot can arrive before `joinRoomPresence` has resolved our own uid (it's a separate,
  // unsequenced effect), and without it we can't tell our own entry apart from everyone else's —
  // better to show nothing for a moment than to flash ourselves twice.
  const connectedPlayers =
    connectedRoomCode === null || localUid === null ? [] : playersByArrival(players).slice(0, adapter.maxPlayers);
  const isHost = localUid !== null && localUid === hostUid;
  // Solo play keeps the fixed local-multiplayer red — once connected, this device's own badge
  // reflects whatever color the host assigned it too, same as everyone else's.
  const soloColor =
    connectedRoomCode !== null && localUid !== null
      ? (players[localUid]?.color ?? adapter.colors[0])
      : PLAYER_COLORS[0];

  // Host-only: whenever who's connected changes (join/leave/kick), recompute everyone's color
  // from scratch by arrival order and write it back — joiners never compute their own colors,
  // they just read whatever's stored, so every device always agrees.
  useEffect(() => {
    if (!isHost || connectedRoomCode === null) return;
    const colorByUid: Record<string, string> = {};
    playersByArrival(players).forEach(([uid, player], index) => {
      const color = adapter.colors[index % adapter.colors.length];
      if (player.color !== color) colorByUid[uid] = color;
    });
    adapter.updateRoomPlayerColors(connectedRoomCode, colorByUid).catch(() => {});
  }, [adapter, isHost, connectedRoomCode, players]);

  // Read-only sections still react to a tap/toggle, but only to explain why nothing happened —
  // auto-dismissed a couple seconds later.
  const [readOnlyNotice, setReadOnlyNotice] = useState(false);
  useEffect(() => {
    if (!readOnlyNotice) return;
    const timeout = setTimeout(() => setReadOnlyNotice(false), 2000);
    return () => clearTimeout(timeout);
  }, [readOnlyNotice]);
  const notifyReadOnly = () => setReadOnlyNotice(true);
  // "Préparation de la partie…" (a spinner, `overlayLoading`) covers the setup while the game is
  // being started, unless a disconnect notice takes precedence.
  const overlayLoading = starting && !connectionLost && disconnectReason === null;
  const overlayMessage = connectionLost
    ? t.setup.online.connectionLostNotice
    : disconnectReason === 'kicked'
      ? t.setup.online.kickedNotice
      : disconnectReason === 'deleted'
        ? t.setup.online.roomDeletedNotice
        : overlayLoading
          ? t.game.loading
          : readOnlyNotice
            ? t.setup.readOnlyNotice
            : null;
  // Tapping the notice dismisses whichever one is showing early, instead of only ever waiting
  // out its own 2s auto-dismiss timeout above. The loading splash isn't dismissable: it goes away
  // by itself once the game screen takes over.
  const dismissOverlay = () => {
    if (overlayLoading) return;
    if (disconnectReason !== null || connectionLost) dismissDisconnectNotice();
    else setReadOnlyNotice(false);
  };

  const party: SetupPartyProps = {
    soloName,
    soloPlaceholder,
    soloColor,
    // Locked once actually connected to a room (host or joiner) — renaming mid-game isn't supported.
    nameEditable: connectedRoomCode === null,
    onChangeName: (text) => updateSettings({ playerNames: [text] } as Partial<S>),
    connectedPlayers,
    localUid,
    hostUid,
    isHost,
    onKick: (uid) => {
      if (connectedRoomCode === null) return;
      adapter.removeRoomPlayer(connectedRoomCode, uid).catch(() => {});
    },
    onlineChoice,
    onChooseSolo: chooseSolo,
    onChooseHost: chooseHost,
    onChooseJoin: chooseJoin,
    roomCode: hostedSilently ? null : roomCode,
    joinCode,
    onJoinCodeChange: setJoinCode,
    // Pre-resolved rather than making the dumb view import `isValidRoomCode` itself: that pulls in
    // `room.ts`, which imports `firebase/firestore` at module scope — fine for the container,
    // but exactly what a dumb view must never transitively depend on.
    joinCodeIsValid: adapter.isValidRoomCode(joinCode.trim().toLowerCase()),
    joinStatus,
  };

  return {
    party,
    readOnly,
    starting,
    connectedRoomCode,
    overlayMessage,
    overlayLoading,
    dismissOverlay,
    notifyReadOnly,
    startOnlineGame,
  };
};
