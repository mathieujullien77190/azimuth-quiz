import type { RoomGameState, RoomSettings } from '@/games/firebase/room';
import { subscribeToRoomGame, subscribeToRoomPlayers, subscribeToRoomSettings } from '@/games/firebase/room';
import type { RoomPlayers, RoomReaction } from '@/firebase/roomApi';

import { useRoomStore } from '../roomStore';

// `room.ts` charge `firebase/firestore` (ESM seul, plante Jest) : les abonnements sont des mocks.
jest.mock('@/games/firebase/room', () => ({
  subscribeToRoomPlayers: jest.fn(),
  subscribeToRoomSettings: jest.fn(),
  subscribeToRoomGame: jest.fn(),
}));

const DEFAULT_GAME = expect.objectContaining({ screen: 'options', places: [], roundIndex: 0 });
const SETTINGS = { rounds: 7 } as unknown as RoomSettings;
const PLAYING = { screen: 'playing' } as unknown as RoomGameState;

const setup = () => {
  const unsubscribePlayers = jest.fn();
  const unsubscribeSettings = jest.fn();
  const unsubscribeGame = jest.fn();
  let onPlayers!: (
    players: RoomPlayers,
    hostUid: string | undefined,
    exists: boolean,
    screen?: string,
    reaction?: RoomReaction | null,
  ) => void;
  let onSettings!: (settings: RoomSettings) => void;
  let onGame!: (state: RoomGameState) => void;

  jest.mocked(subscribeToRoomPlayers).mockImplementation((_code, callback) => {
    onPlayers = callback as never;
    return unsubscribePlayers;
  });
  jest.mocked(subscribeToRoomSettings).mockImplementation((_code, callback) => {
    onSettings = callback;
    return unsubscribeSettings;
  });
  jest.mocked(subscribeToRoomGame).mockImplementation((_code, callback) => {
    onGame = callback;
    return unsubscribeGame;
  });

  return {
    unsubscribers: [unsubscribePlayers, unsubscribeSettings, unsubscribeGame],
    emitPlayers: (players: RoomPlayers, hostUid: string | undefined, exists = true, reaction?: RoomReaction | null) =>
      onPlayers(players, hostUid, exists, 'options', reaction),
    emitSettings: (settings: RoomSettings) => onSettings(settings),
    emitGame: (state: RoomGameState) => onGame(state),
  };
};

// Singleton de module : on referme la room (listeners, drapeaux) entre les tests.
afterEach(() => useRoomStore.getState().disconnect());

const ZOE: RoomPlayers = { zoe: { name: 'Zoe', joinedAt: null } };

describe('useRoomStore — connect', () => {
  it('starts disconnected with the default game state', () => {
    setup();
    expect(useRoomStore.getState()).toMatchObject({
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
    const { emitPlayers, emitSettings, emitGame } = setup();
    useRoomStore.getState().connect('tabofuna');
    expect(useRoomStore.getState().code).toBe('tabofuna');

    emitPlayers(ZOE, 'zoe');
    emitSettings(SETTINGS);
    emitGame(PLAYING);

    expect(useRoomStore.getState()).toMatchObject({
      players: ZOE,
      hostUid: 'zoe',
      roomSettings: SETTINGS,
      gameState: PLAYING,
    });
  });

  it('keeps a missing host as null', () => {
    const { emitPlayers } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers(ZOE, undefined);
    expect(useRoomStore.getState().hostUid).toBeNull();
  });

  it('is a no-op when already connected to the same code', () => {
    const { unsubscribers } = setup();
    useRoomStore.getState().connect('tabofuna');
    useRoomStore.getState().connect('tabofuna');
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).not.toHaveBeenCalled());
  });

  it('drops the previous room subscriptions when connecting to another code', () => {
    const { unsubscribers } = setup();
    useRoomStore.getState().connect('tabofuna');
    useRoomStore.getState().connect('kiloba');
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
    expect(useRoomStore.getState().code).toBe('kiloba');
  });

  it('resets connectionLost when connecting', () => {
    setup();
    useRoomStore.getState().markConnectionLost();
    useRoomStore.getState().connect('tabofuna');
    expect(useRoomStore.getState().connectionLost).toBe(false);
  });
});

describe('useRoomStore — room deletion', () => {
  it('flags the room as gone once it was seen and then disappears, keeping the last players', () => {
    const { emitPlayers } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    emitPlayers({}, undefined, false);
    expect(useRoomStore.getState().roomExists).toBe(false);
    expect(useRoomStore.getState().players).toEqual(ZOE);
  });

  it('does not flag a room that never loaded as deleted', () => {
    const { emitPlayers } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers({}, undefined, false);
    expect(useRoomStore.getState().roomExists).toBe(true);
  });

  it('forgets having seen the previous room when connecting to a new one', () => {
    const { emitPlayers } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    useRoomStore.getState().connect('kiloba');
    emitPlayers({}, undefined, false);
    expect(useRoomStore.getState().roomExists).toBe(true);
  });
});

describe('useRoomStore — disconnect', () => {
  it('unsubscribes everything and resets to the defaults', () => {
    const { unsubscribers, emitPlayers, emitGame } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    emitGame(PLAYING);
    useRoomStore.setState({ localUid: 'zoe' });
    useRoomStore.getState().markConnectionLost();

    useRoomStore.getState().disconnect();

    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
    expect(useRoomStore.getState()).toMatchObject({
      code: null,
      players: {},
      hostUid: null,
      gameState: DEFAULT_GAME,
      localUid: null,
      connectionLost: false,
    });
  });

  it('does not unsubscribe twice', () => {
    const { unsubscribers } = setup();
    useRoomStore.getState().connect('tabofuna');
    useRoomStore.getState().disconnect();
    useRoomStore.getState().disconnect();
    unsubscribers.forEach((unsubscribe) => expect(unsubscribe).toHaveBeenCalledTimes(1));
  });
});

describe('useRoomStore — voluntary leave', () => {
  it('reports the flag once, then clears it', () => {
    setup();
    expect(useRoomStore.getState().consumeVoluntaryLeave()).toBe(false);
    useRoomStore.getState().markVoluntaryLeave();
    expect(useRoomStore.getState().consumeVoluntaryLeave()).toBe(true);
    expect(useRoomStore.getState().consumeVoluntaryLeave()).toBe(false);
  });

  it('is cleared when connecting to a room', () => {
    setup();
    useRoomStore.getState().markVoluntaryLeave();
    useRoomStore.getState().connect('tabofuna');
    expect(useRoomStore.getState().consumeVoluntaryLeave()).toBe(false);
  });
});

describe('useRoomStore — reactions', () => {
  it('keeps the latest reaction of the room, none until one is sent, and forgets it on disconnect', () => {
    const { emitPlayers } = setup();
    useRoomStore.getState().connect('tabofuna');
    emitPlayers(ZOE, 'zoe');
    expect(useRoomStore.getState().reaction).toBeNull();

    const reaction = { uid: 'zoe', emoji: '👍', seq: 1 };
    emitPlayers(ZOE, 'zoe', true, reaction);
    expect(useRoomStore.getState().reaction).toEqual(reaction);

    useRoomStore.getState().disconnect();
    expect(useRoomStore.getState().reaction).toBeNull();
  });
});
