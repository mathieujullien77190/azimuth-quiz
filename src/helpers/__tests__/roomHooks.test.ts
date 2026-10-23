import { act, renderHook } from '@testing-library/react-native';

import { REACTION_COOLDOWN_MS, REACTIONS_PER_GAME } from '@/data';
import { useRoomStore } from '@/store/roomStore';
import type { RoomStoreState } from '@/store/types';

import type { RoomPlayers, RoomReaction } from '../../firebase/room';
import { resetErrorThrottle, setErrorReporter } from '../errors';
import { useHostPruneLeavers, useOnlineRoomSession, useRoomPresence, useRoomReactions } from '../roomHooks';

// `room.ts` charge `firebase/firestore` (ESM seul, plante Jest) : le store n'ouvre ici aucun abonnement.
jest.mock('@/firebase/room', () => ({}));
const mockDismissTo = jest.fn();
const mockRouter = { dismissTo: mockDismissTo };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

{
  const player = (name: string) => ({ name, joinedAt: null });
  const PLAYERS: RoomPlayers = { host: player('Zoé'), max: player('Max') };

  const setup = async (
    overrides: Partial<{ isHost: boolean; localUid: string | null; players: RoomPlayers; gameState: unknown }> = {},
  ) => {
    const prune = jest.fn(() => Promise.resolve());
    const props = { isHost: true, localUid: 'host', players: PLAYERS, gameState: {}, ...overrides };
    const hook = await renderHook(
      (current: typeof props) =>
        useHostPruneLeavers(current.isHost, current.localUid, current.players, current.gameState, prune),
      { initialProps: props },
    );
    return { prune, props, ...hook };
  };

  describe('useHostPruneLeavers', () => {
    it('erases, in every map, what a player who is no longer in the room left behind', async () => {
      const { prune } = await setup({
        gameState: {
          guesses: { host: {}, max: {}, eve: {} },
          scores: { host: {}, eve: {} },
          totalScores: { host: 10, eve: 30, ghost: 5 },
        },
      });
      expect(prune).toHaveBeenCalledWith({
        guesses: ['eve'],
        scores: ['eve'],
        totalScores: ['eve', 'ghost'],
      });
    });

    it('only names the maps that actually hold something stale', async () => {
      const { prune } = await setup({ gameState: { totalScores: { host: 10, eve: 30 } } });
      expect(prune).toHaveBeenCalledWith({ totalScores: ['eve'] });
    });

    it('does nothing when everybody in the round data is still in the room', async () => {
      const { prune } = await setup({ gameState: { guesses: { host: {} }, totalScores: { host: 1, max: 2 } } });
      expect(prune).not.toHaveBeenCalled();
    });

    it('copes with a game state that has none of these maps, or a null one (scores before the reveal)', async () => {
      const withoutMaps = await setup({ gameState: { screen: 'game' } });
      expect(withoutMaps.prune).not.toHaveBeenCalled();
      await withoutMaps.unmount();
      const nullScores = await setup({ gameState: { scores: null } });
      expect(nullScores.prune).not.toHaveBeenCalled();
    });

    it('is left to the host', async () => {
      const { prune } = await setup({ isHost: false, gameState: { totalScores: { eve: 30 } } });
      expect(prune).not.toHaveBeenCalled();
    });

    it('waits until this device knows who it is and is listed among the players', async () => {
      const unknown = await setup({ localUid: null, gameState: { totalScores: { eve: 30 } } });
      expect(unknown.prune).not.toHaveBeenCalled();
      await unknown.unmount();
      // Liste de joueurs pas encore chargee (vide) : sinon lue comme "tout le monde est parti".
      const notListed = await setup({ players: {}, gameState: { totalScores: { host: 30 } } });
      expect(notListed.prune).not.toHaveBeenCalled();
    });

    it('cleans up as soon as a player leaves during the game', async () => {
      const { prune, rerender, props } = await setup({ gameState: { totalScores: { host: 10, max: 20 } } });
      expect(prune).not.toHaveBeenCalled();
      await rerender({ ...props, players: { host: player('Zoé') } });
      expect(prune).toHaveBeenCalledWith({ totalScores: ['max'] });
    });

    it('swallows a failed write', async () => {
      const failing = jest.fn(() => Promise.reject(new Error('offline')));
      await renderHook(() => useHostPruneLeavers(true, 'host', PLAYERS, { totalScores: { eve: 1 } }, failing));
      expect(failing).toHaveBeenCalledTimes(1);
    });
  });
}

{
  // Singleton de module : retour a l'etat initial entre les tests.
  const INITIAL_STATE = useRoomStore.getState();
  beforeEach(() => useRoomStore.setState(INITIAL_STATE, true));

  const seen = (millis: number) => ({ toMillis: () => millis }) as never;
  const player = (name: string, lastSeen?: number) => ({
    name,
    joinedAt: null,
    ...(lastSeen === undefined ? {} : { lastSeen: seen(lastSeen) }),
  });

  const SEC = 1000;

  const setup = async ({ me, players, screen = 'game' }: { me: string; players: RoomPlayers; screen?: string }) => {
    useRoomStore.setState({ localUid: me, hostUid: 'host', players, gameState: { screen } as never });
    const api = {
      sendHeartbeat: jest.fn(() => Promise.resolve()),
      deleteRoom: jest.fn(() => Promise.resolve()),
      removeRoomPlayer: jest.fn(() => Promise.resolve()),
    };
    await renderHook(() => useRoomPresence(api, 'room'));
    return { api };
  };

  /** Avance par pas de 10 s (la periode de controle) pour que chaque intervalle tourne dans l'ordre. */
  const advance = async (seconds: number) => {
    for (let elapsed = 0; elapsed < seconds; elapsed += 10) await act(async () => jest.advanceTimersByTime(10 * SEC));
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('useRoomPresence — when it runs', () => {
    it('sends nothing alone in the room', async () => {
      const { api } = await setup({ me: 'host', players: { host: player('Zoé') } });
      await advance(120);
      expect(api.sendHeartbeat).not.toHaveBeenCalled();
    });

    it('sends nothing in the lobby', async () => {
      const { api } = await setup({
        me: 'host',
        players: { host: player('Zoé'), max: player('Max') },
        screen: 'options',
      });
      await advance(120);
      expect(api.sendHeartbeat).not.toHaveBeenCalled();
    });

    it('beats right away then every 30s during a multiplayer game', async () => {
      const { api } = await setup({ me: 'host', players: { host: player('Zoé'), max: player('Max', 1) } });
      expect(api.sendHeartbeat).toHaveBeenCalledTimes(1);
      expect(api.sendHeartbeat).toHaveBeenCalledWith('room', 'host');
      await advance(60);
      expect(api.sendHeartbeat).toHaveBeenCalledTimes(3);
    });
  });

  describe('useRoomPresence — losing a connection', () => {
    it('a joiner leaves when the host goes silent for 90s', async () => {
      const { api } = await setup({
        me: 'max',
        players: { host: player('Zoé', 1), max: player('Max') },
      });
      await advance(80);
      expect(useRoomStore.getState().connectionLost).toBe(false);
      await advance(30);
      expect(useRoomStore.getState().connectionLost).toBe(true);
      expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
      expect(api.deleteRoom).not.toHaveBeenCalled();
    });

    it('a host that keeps seeing the joiner’s heartbeat changes never loses it', async () => {
      const { api } = await setup({
        me: 'host',
        players: { host: player('Zoé'), max: player('Max', 1) },
      });
      for (let beat = 2; beat < 8; beat += 1) {
        await advance(30);
        await act(async () => useRoomStore.setState({ players: { host: player('Zoé'), max: player('Max', beat) } }));
      }
      expect(api.removeRoomPlayer).not.toHaveBeenCalled();
      expect(useRoomStore.getState().connectionLost).toBe(false);
    });

    it('the host removes a joiner that went silent for 90s, and the game goes on', async () => {
      const { api } = await setup({
        me: 'host',
        players: { host: player('Zoé'), max: player('Max', 1) },
      });
      await advance(110);
      expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
      expect(useRoomStore.getState().connectionLost).toBe(false);
    });

    it('leaves when its own heartbeat is never acknowledged (host: deletes the room)', async () => {
      useRoomStore.setState({
        localUid: 'host',
        hostUid: 'host',
        players: { host: player('Zoé'), max: player('Max', 1) },
        gameState: { screen: 'game' } as never,
      });
      const api = {
        sendHeartbeat: jest.fn(() => new Promise<void>(() => {})),
        deleteRoom: jest.fn(() => Promise.resolve()),
        removeRoomPlayer: jest.fn(() => Promise.resolve()),
      };
      await renderHook(() => useRoomPresence(api, 'room'));
      // Le joiner continue son heartbeat, seules les ecritures de cet appareil ne reviennent jamais.
      for (let second = 10; second <= 110; second += 10) {
        await advance(10);
        await act(async () => useRoomStore.setState({ players: { host: player('Zoé'), max: player('Max', second) } }));
      }
      expect(useRoomStore.getState().connectionLost).toBe(true);
      expect(api.deleteRoom).toHaveBeenCalledWith('room');
    });

    it('does not mistake a suspended device (background, locked screen) for a lost connection', async () => {
      const { api } = await setup({
        me: 'max',
        players: { host: player('Zoé', 1), max: player('Max') },
      });
      await advance(20);
      // Appli gelee 5 minutes : aucun timer n'a tourne.
      jest.setSystemTime(Date.now() + 300 * SEC);
      await advance(10);
      expect(useRoomStore.getState().connectionLost).toBe(false);
      expect(api.removeRoomPlayer).not.toHaveBeenCalled();
    });
  });

  describe('useRoomPresence — edge cases', () => {
    const setupWith = async (me: string, players: RoomPlayers, api: Record<string, jest.Mock>) => {
      useRoomStore.setState({ localUid: me, hostUid: 'host', players, gameState: { screen: 'game' } as never });
      await renderHook(() => useRoomPresence(api as never, 'room'));
    };
    const failingApi = () => ({
      sendHeartbeat: jest.fn(() => Promise.resolve()),
      deleteRoom: jest.fn(() => Promise.reject(new Error('gone'))),
      removeRoomPlayer: jest.fn(() => Promise.reject(new Error('gone'))),
    });

    it('a host that never wrote a heartbeat counts as silent too', async () => {
      await setup({ me: 'max', players: { host: player('Zoé'), max: player('Max') } });
      await advance(110);
      expect(useRoomStore.getState().connectionLost).toBe(true);
    });

    it('forgets a player that left the room instead of judging it later', async () => {
      const { api } = await setup({
        me: 'host',
        players: { host: player('Zoé'), max: player('Max', 1) },
      });
      await advance(60);
      await act(async () => useRoomStore.setState({ players: { host: player('Zoé') } }));
      await advance(60);
      expect(api.removeRoomPlayer).not.toHaveBeenCalled();
    });

    it('keeps judging the others once one of several players left', async () => {
      const { api } = await setup({
        me: 'host',
        players: { host: player('Zoé'), max: player('Max', 1), eve: player('Eve', 1) },
      });
      await advance(60);
      // Max part ; Eve est toujours la mais reste silencieuse.
      await act(async () => useRoomStore.setState({ players: { host: player('Zoé'), eve: player('Eve', 1) } }));
      await advance(60);
      expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'eve');
      expect(api.removeRoomPlayer).not.toHaveBeenCalledWith('room', 'max');
    });

    it('survives a heartbeat that is rejected', async () => {
      const api = failingApi();
      api.sendHeartbeat = jest.fn(() => Promise.reject(new Error('offline')));
      await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
      await advance(30);
      expect(api.sendHeartbeat).toHaveBeenCalled();
      expect(useRoomStore.getState().connectionLost).toBe(false);
    });

    it('a joiner survives a failing presence removal when leaving', async () => {
      const api = failingApi();
      await setupWith('max', { host: player('Zoé', 1), max: player('Max') }, api);
      await advance(110);
      expect(useRoomStore.getState().connectionLost).toBe(true);
      expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
    });

    it('a host survives a failing room deletion when leaving', async () => {
      const api = failingApi();
      api.sendHeartbeat = jest.fn(() => new Promise<void>(() => {}));
      await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
      for (let second = 10; second <= 110; second += 10) {
        await advance(10);
        await act(async () => useRoomStore.setState({ players: { host: player('Zoé'), max: player('Max', second) } }));
      }
      expect(useRoomStore.getState().connectionLost).toBe(true);
      expect(api.deleteRoom).toHaveBeenCalledWith('room');
    });

    it('a host survives a failing removal of a silent joiner', async () => {
      const api = failingApi();
      await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
      await advance(110);
      expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
      expect(useRoomStore.getState().connectionLost).toBe(false);
    });
  });
}

{
  const PLAYERS: RoomPlayers = {
    zoe: { name: 'Zoé', joinedAt: null },
    max: { name: 'Max', joinedAt: null },
  };
  const reaction = (seq: number, uid = 'max', emoji = '🔥'): RoomReaction => ({ uid, emoji, seq });

  type Props = { reaction: RoomReaction | null; players?: RoomPlayers };

  const setup = async (initial: Props, sendReaction = jest.fn(() => Promise.resolve())) => {
    const hook = await renderHook(
      (props: Props) => useRoomReactions(props.reaction, props.players ?? PLAYERS, sendReaction, 'tabofuna'),
      { initialProps: initial },
    );
    return { ...hook, sendReaction };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(10_000);
  });
  afterEach(() => jest.useRealTimers());

  describe('useRoomReactions — what is received', () => {
    it('shows nothing until a reaction comes', async () => {
      const { result } = await setup({ reaction: null });
      expect(result.current.reaction).toBeNull();
    });

    it('ignores the reaction already in the room when the screen opens: it is an old one', async () => {
      const { result } = await setup({ reaction: reaction(1) });
      expect(result.current.reaction).toBeNull();
    });

    it('shows a new reaction with the name of its sender, whoever it is — the sender of this device too', async () => {
      const { result, rerender } = await setup({ reaction: null });
      await rerender({ reaction: reaction(1, 'max', '👍') });
      expect(result.current.reaction).toEqual({ emoji: '👍', name: 'Max', seq: 1 });
      await rerender({ reaction: reaction(2, 'zoe', '😂') });
      expect(result.current.reaction).toEqual({ emoji: '😂', name: 'Zoé', seq: 2 });
    });

    it('names nobody when the sender is not in the room any more', async () => {
      const { result, rerender } = await setup({ reaction: null });
      await rerender({ reaction: reaction(1, 'ghost') });
      expect(result.current.reaction).toEqual({ emoji: '🔥', name: null, seq: 1 });
    });

    it('shows a reaction once: the same one coming again changes nothing', async () => {
      const { result, rerender } = await setup({ reaction: null });
      await rerender({ reaction: reaction(1) });
      const first = result.current.reaction;
      await rerender({ reaction: reaction(1), players: { ...PLAYERS } });
      expect(result.current.reaction).toEqual(first);
    });
  });

  describe('useRoomReactions — what is sent', () => {
    it('sends the emoji to the room', async () => {
      const { result, sendReaction } = await setup({ reaction: null });
      await act(async () => result.current.send('🔥'));
      expect(sendReaction).toHaveBeenCalledWith('tabofuna', '🔥');
    });

    it('holds back a second send that comes too soon, and lets the next one through after the cooldown', async () => {
      const { result, sendReaction } = await setup({ reaction: null });
      await act(async () => result.current.send('🔥'));
      await act(async () => result.current.send('👍'));
      expect(sendReaction).toHaveBeenCalledTimes(1);

      await act(async () => jest.advanceTimersByTime(REACTION_COOLDOWN_MS));
      await act(async () => result.current.send('👍'));
      expect(sendReaction).toHaveBeenCalledTimes(2);
      expect(sendReaction).toHaveBeenLastCalledWith('tabofuna', '👍');
    });

    it('only logs a failed send, never raising it to the player', async () => {
      const reporter = jest.fn(() => Promise.resolve());
      setErrorReporter(reporter);
      resetErrorThrottle();
      const { result } = await setup(
        { reaction: null },
        jest.fn(() => Promise.reject(new Error('offline'))),
      );
      await act(async () => result.current.send('🔥'));
      await act(async () => {});
      expect(reporter).toHaveBeenCalledWith(expect.objectContaining({ action: 'room.reaction', kind: 'background' }));
      setErrorReporter(null);
    });
  });

  describe('useRoomReactions — alone in the room', () => {
    it('cannot react with nobody to send to, and can with another player', async () => {
      const alone = await setup({ reaction: null, players: { zoe: PLAYERS.zoe } });
      expect(alone.result.current.canReact).toBe(false);
      const together = await setup({ reaction: null });
      expect(together.result.current.canReact).toBe(true);
    });
  });

  describe('useRoomReactions — the limit per game', () => {
    it('lets a player send REACTIONS_PER_GAME reactions, then hides the button and sends no more', async () => {
      const { result, sendReaction } = await setup({ reaction: null });
      for (let index = 0; index < REACTIONS_PER_GAME; index += 1) {
        expect(result.current.canReact).toBe(true);
        await act(async () => result.current.send('👍'));
        await act(async () => jest.advanceTimersByTime(REACTION_COOLDOWN_MS));
      }
      expect(sendReaction).toHaveBeenCalledTimes(REACTIONS_PER_GAME);
      expect(result.current.canReact).toBe(false);
      await act(async () => result.current.send('👍'));
      expect(sendReaction).toHaveBeenCalledTimes(REACTIONS_PER_GAME);
    });
  });
}

{
  type State = RoomStoreState;

  const arrivedAt = (millis: number) => ({ toMillis: () => millis }) as never;

  // Le vrai store, remplace en entier : actions espionnees, etat de depart d'une manche en cours.
  const makeStore = (overrides: Partial<State> = {}) => {
    useRoomStore.setState(
      {
        code: 'tabofuna',
        players: {},
        hostUid: null,
        roomExists: true,
        roomSettings: null,
        gameState: { screen: 'playing' } as never,
        reaction: null,
        localUid: null,
        connectionLost: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        markConnectionLost: jest.fn(),
        markVoluntaryLeave: jest.fn(),
        consumeVoluntaryLeave: jest.fn(() => false),
        ...overrides,
      },
      true,
    );
    return useRoomStore;
  };

  const setup = async (overrides: Partial<State> = {}) => {
    const store = makeStore(overrides);
    const roomApi = {
      deleteRoom: jest.fn(() => Promise.resolve()),
      restartRoom: jest.fn(() => Promise.resolve()),
      sendReaction: jest.fn(() => Promise.resolve()),
      pruneRoomPlayerData: jest.fn(() => Promise.resolve()),
      removeRoomPlayer: jest.fn(() => Promise.resolve()),
    };
    const onQuit = jest.fn();
    const hook = await renderHook(() => useOnlineRoomSession(roomApi, 'tabofuna', onQuit));
    return { store, roomApi, onQuit, ...hook };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockDismissTo.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  describe('useOnlineRoomSession — state', () => {
    it('exposes the store state, the arrival-ordered players and the host flag', async () => {
      const players: RoomPlayers = {
        late: { name: 'Late', joinedAt: arrivedAt(20) },
        early: { name: 'Early', joinedAt: arrivedAt(10) },
      };
      const { result } = await setup({ players, hostUid: 'early', localUid: 'early' });

      expect(result.current.onlinePlayers.map((player) => player.uid)).toEqual(['early', 'late']);
      expect(result.current.isHost).toBe(true);
      expect(result.current.hostUid).toBe('early');
      expect(result.current.gameState).toEqual({ screen: 'playing' });
      expect(result.current.connectionLost).toBe(false);
    });

    it('is not host on a joiner device, nor before the local uid is known', async () => {
      const joiner = await setup({ hostUid: 'host', localUid: 'joiner' });
      expect(joiner.result.current.isHost).toBe(false);
      const unknown = await setup({ hostUid: null, localUid: null });
      expect(unknown.result.current.isHost).toBe(false);
    });

    it('reports whether the store is still connected to a room', async () => {
      const { result, store } = await setup();
      expect(result.current.connected).toBe(true);
      await act(async () => store.setState({ code: null }));
      expect(result.current.connected).toBe(false);
    });
  });

  describe('useOnlineRoomSession — room gone', () => {
    it('stays put while the room exists and the connection holds', async () => {
      await setup();
      await act(async () => jest.advanceTimersByTime(5000));
      expect(mockDismissTo).not.toHaveBeenCalled();
    });

    it('heads home after 2s once the room was deleted', async () => {
      const { store } = await setup();
      await act(async () => store.setState({ roomExists: false }));
      await act(async () => jest.advanceTimersByTime(1999));
      expect(mockDismissTo).not.toHaveBeenCalled();
      await act(async () => jest.advanceTimersByTime(1));
      expect(mockDismissTo).toHaveBeenCalledWith('/');
    });

    it('heads home too when the connection was lost', async () => {
      await setup({ connectionLost: true });
      await act(async () => jest.advanceTimersByTime(2000));
      expect(mockDismissTo).toHaveBeenCalledWith('/');
    });

    it('cancels the redirect if the room comes back in time', async () => {
      const { store } = await setup({ roomExists: false });
      await act(async () => store.setState({ roomExists: true }));
      await act(async () => jest.advanceTimersByTime(5000));
      expect(mockDismissTo).not.toHaveBeenCalled();
    });
  });

  describe('useOnlineRoomSession — handleQuit', () => {
    it('host: deletes the room, disconnects the store and goes straight home', async () => {
      const disconnect = jest.fn();
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: 'zoe', disconnect });

      await act(async () => result.current.handleQuit());

      expect(roomApi.deleteRoom).toHaveBeenCalledWith('tabofuna');
      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(mockDismissTo).toHaveBeenCalledWith('/');
      expect(onQuit).not.toHaveBeenCalled();
    });

    it('host: swallows a failing room deletion', async () => {
      const { result, roomApi } = await setup({ hostUid: 'zoe', localUid: 'zoe' });
      roomApi.deleteRoom.mockRejectedValue(new Error('permission-denied'));
      await act(async () => result.current.handleQuit());
      expect(mockDismissTo).toHaveBeenCalledWith('/');
    });

    it('joiner: marks a voluntary leave, drops its own presence, then calls onQuit', async () => {
      const markVoluntaryLeave = jest.fn();
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max', markVoluntaryLeave });

      await act(async () => result.current.handleQuit());

      expect(markVoluntaryLeave).toHaveBeenCalledTimes(1);
      expect(roomApi.removeRoomPlayer).toHaveBeenCalledWith('tabofuna', 'max');
      expect(roomApi.deleteRoom).not.toHaveBeenCalled();
      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(mockDismissTo).not.toHaveBeenCalled();
    });

    it('joiner: swallows a failing presence removal', async () => {
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max' });
      roomApi.removeRoomPlayer.mockRejectedValue(new Error('gone'));
      await act(async () => result.current.handleQuit());
      expect(onQuit).toHaveBeenCalledTimes(1);
    });

    it('without a local uid, only calls onQuit', async () => {
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: null });
      await act(async () => result.current.handleQuit());
      expect(roomApi.removeRoomPlayer).not.toHaveBeenCalled();
      expect(onQuit).toHaveBeenCalledTimes(1);
    });
  });

  describe('useOnlineRoomSession — players who left', () => {
    it('the host erases their leftovers from the round data', async () => {
      const players: RoomPlayers = { host: { name: 'Zoé', joinedAt: null } };
      const { roomApi } = await setup({
        players,
        hostUid: 'host',
        localUid: 'host',
        gameState: { screen: 'playing', totalScores: { host: 10, max: 20 } } as never,
      });
      expect(roomApi.pruneRoomPlayerData).toHaveBeenCalledWith('tabofuna', { totalScores: ['max'] });
    });

    it('a joiner leaves that to the host', async () => {
      const players: RoomPlayers = { host: { name: 'Zoé', joinedAt: null }, joiner: { name: 'Max', joinedAt: null } };
      const { roomApi } = await setup({
        players,
        hostUid: 'host',
        localUid: 'joiner',
        gameState: { screen: 'playing', totalScores: { eve: 20 } } as never,
      });
      expect(roomApi.pruneRoomPlayerData).not.toHaveBeenCalled();
    });
  });

  describe('useOnlineRoomSession — replay', () => {
    it('host: asks the room to go back to its lobby', async () => {
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: 'zoe' });
      await act(async () => result.current.handleReplay());
      expect(roomApi.restartRoom).toHaveBeenCalledWith('tabofuna');
      expect(onQuit).not.toHaveBeenCalled();
    });

    it('host: survives a failing restart', async () => {
      const { result, roomApi } = await setup({ hostUid: 'zoe', localUid: 'zoe' });
      roomApi.restartRoom.mockRejectedValueOnce(new Error('offline'));
      await act(async () => result.current.handleReplay());
      expect(roomApi.restartRoom).toHaveBeenCalledTimes(1);
    });

    it('joiner: just goes back to its setup screen, without writing the room', async () => {
      const { result, roomApi, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max' });
      await act(async () => result.current.handleReplay());
      expect(onQuit).toHaveBeenCalledTimes(1);
      expect(roomApi.restartRoom).not.toHaveBeenCalled();
    });

    it('steps off the game screen once the room is back in its lobby, only once', async () => {
      const { store, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max' });
      expect(onQuit).not.toHaveBeenCalled();
      await act(async () => store.setState({ gameState: { screen: 'options' } as never }));
      expect(onQuit).toHaveBeenCalledTimes(1);
      await act(async () => store.setState({ players: {} }));
      expect(onQuit).toHaveBeenCalledTimes(1);
    });

    it('does not step off when the store was disconnected (its reset state is also the lobby)', async () => {
      const { store, onQuit } = await setup({ hostUid: 'zoe', localUid: 'zoe' });
      await act(async () => store.setState({ code: null, gameState: { screen: 'options' } as never }));
      expect(onQuit).not.toHaveBeenCalled();
    });

    it('does not step off when the room is gone', async () => {
      const { store, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max' });
      await act(async () => store.setState({ roomExists: false, gameState: { screen: 'options' } as never }));
      expect(onQuit).not.toHaveBeenCalled();
    });
  });

  describe('useOnlineRoomSession — emoji reactions', () => {
    const players: RoomPlayers = {
      zoe: { name: 'Zoé', joinedAt: arrivedAt(1) },
      max: { name: 'Max', joinedAt: arrivedAt(2) },
    };

    it('sends a reaction through the room api, for the room it is in', async () => {
      const { result, roomApi } = await setup({ players, localUid: 'zoe' });
      expect(result.current.reactions.canReact).toBe(true);
      await act(async () => result.current.reactions.send('🔥'));
      expect(roomApi.sendReaction).toHaveBeenCalledWith('tabofuna', '🔥');
    });

    it('shows the reaction the store gets, with the name of its sender', async () => {
      const { result, store } = await setup({ players, localUid: 'zoe' });
      expect(result.current.reactions.reaction).toBeNull();
      await act(async () => store.setState({ reaction: { uid: 'max', emoji: '👏', seq: 5 } }));
      expect(result.current.reactions.reaction).toEqual({ emoji: '👏', name: 'Max', seq: 5 });
    });

    it('cannot react alone in the room', async () => {
      const { result } = await setup({ players: { zoe: players.zoe }, localUid: 'zoe' });
      expect(result.current.reactions.canReact).toBe(false);
    });
  });
}
