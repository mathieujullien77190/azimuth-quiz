import { createRoomStore } from './createRoomStore';
import type { RoomPlayers } from './roomBase';

type Settings = { rounds: number };
type GameState = { screen: string };

const DEFAULT_GAME: GameState = { screen: 'idle' };

const setup = () => {
  const unsubscribePlayers = jest.fn();
  const unsubscribeSettings = jest.fn();
  const unsubscribeGame = jest.fn();
  let onPlayers!: (players: RoomPlayers, hostUid: string | undefined, exists: boolean) => void;
  let onSettings!: (settings: Settings) => void;
  let onGame!: (state: GameState) => void;

  const store = createRoomStore<Settings, GameState>({
    defaultGameState: DEFAULT_GAME,
    subscribeToRoomPlayers: jest.fn((_code, callback) => {
      onPlayers = callback;
      return unsubscribePlayers;
    }),
    subscribeToRoomSettings: jest.fn((_code, callback) => {
      onSettings = callback;
      return unsubscribeSettings;
    }),
    subscribeToRoomGame: jest.fn((_code, callback) => {
      onGame = callback;
      return unsubscribeGame;
    }),
  });

  return {
    store,
    unsubscribers: [unsubscribePlayers, unsubscribeSettings, unsubscribeGame],
    emitPlayers: (players: RoomPlayers, hostUid: string | undefined, exists = true) =>
      onPlayers(players, hostUid, exists),
    emitSettings: (settings: Settings) => onSettings(settings),
    emitGame: (state: GameState) => onGame(state),
  };
};

const ZOE: RoomPlayers = { zoe: { name: 'Zoe', joinedAt: null } };

describe('createRoomStore — connect', () => {
  it('starts disconnected with the default game state', () => {
    const { store } = setup();
    expect(store.getState()).toMatchObject({
      code: null,
      players: {},
      hostUid: null,
      roomExists: true,
      roomSettings: null,
      gameState: DEFAULT_GAME,
      localUid: null,
      connectionLost: false,
    });
  });

  it('feeds players, host, settings and game state from the three subscriptions', () => {
    const { store, emitPlayers, emitSettings, emitGame } = setup();
    store.getState().connect('tabofuna');
    expect(store.getState().code).toBe('tabofuna');

    emitPlayers(ZOE, 'zoe');
    emitSettings({ rounds: 7 });
    emitGame({ screen: 'playing' });

    expect(store.getState()).toMatchObject({
      players: ZOE,
      hostUid: 'zoe',
      roomSettings: { rounds: 7 },
      gameState: { screen: 'playing' },
    });
  });

  it('keeps a missing host as null', () => {
    const { store, emitPlayers } = setup();
    store.getState().connect('tabofuna');
    emitPlayers(ZOE, undefined);
    expect(store.getState().hostUid).toBeNull();
  });

  it('is a no-op when already connected to the same code', () => {
    const { store, unsubscribers } = setup();
    store.getState().connect('tabofuna');
    store.getState().connect('tabofuna');
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).not.toHaveBeenCalled());
  });

  it('drops the previous room subscriptions when connecting to another code', () => {
    const { store, unsubscribers } = setup();
    store.getState().connect('tabofuna');
    store.getState().connect('kiloba');
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
    expect(store.getState().code).toBe('kiloba');
  });

  it('resets connectionLost when connecting', () => {
    const { store } = setup();
    store.getState().markConnectionLost();
    store.getState().connect('tabofuna');
    expect(store.getState().connectionLost).toBe(false);
  });
});

describe('createRoomStore — room deletion', () => {
  it('flags the room as gone once it was seen and then disappears, keeping the last players', () => {
    const { store, emitPlayers } = setup();
    store.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    emitPlayers({}, undefined, false);
    expect(store.getState().roomExists).toBe(false);
    expect(store.getState().players).toEqual(ZOE);
  });

  it('does not flag a room that never loaded as deleted', () => {
    const { store, emitPlayers } = setup();
    store.getState().connect('tabofuna');
    emitPlayers({}, undefined, false);
    expect(store.getState().roomExists).toBe(true);
  });

  it('forgets having seen the previous room when connecting to a new one', () => {
    const { store, emitPlayers } = setup();
    store.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    store.getState().connect('kiloba');
    emitPlayers({}, undefined, false);
    expect(store.getState().roomExists).toBe(true);
  });
});

describe('createRoomStore — disconnect', () => {
  it('unsubscribes everything and resets to the defaults', () => {
    const { store, unsubscribers, emitPlayers, emitGame } = setup();
    store.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    emitGame({ screen: 'playing' });
    store.setState({ localUid: 'zoe' });
    store.getState().markConnectionLost();

    store.getState().disconnect();

    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
    expect(store.getState()).toMatchObject({
      code: null,
      players: {},
      hostUid: null,
      gameState: DEFAULT_GAME,
      localUid: null,
      connectionLost: false,
    });
  });

  it('does not unsubscribe twice', () => {
    const { store, unsubscribers } = setup();
    store.getState().connect('tabofuna');
    store.getState().disconnect();
    store.getState().disconnect();
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
  });
});

describe('createRoomStore — voluntary leave', () => {
  it('reports the flag once, then clears it', () => {
    const { store } = setup();
    expect(store.getState().consumeVoluntaryLeave()).toBe(false);
    store.getState().markVoluntaryLeave();
    expect(store.getState().consumeVoluntaryLeave()).toBe(true);
    expect(store.getState().consumeVoluntaryLeave()).toBe(false);
  });

  it('is cleared when connecting to a room', () => {
    const { store } = setup();
    store.getState().markVoluntaryLeave();
    store.getState().connect('tabofuna');
    expect(store.getState().consumeVoluntaryLeave()).toBe(false);
  });
});
