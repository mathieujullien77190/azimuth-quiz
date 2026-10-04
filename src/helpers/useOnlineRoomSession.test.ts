import { act, renderHook } from '@testing-library/react-native';
import { create } from 'zustand';

import type { RoomStoreState } from './createRoomStore';
import type { RoomPlayers } from './roomBase';
import { useOnlineRoomSession } from './useOnlineRoomSession';

const mockDismissTo = jest.fn();
const mockRouter = { dismissTo: mockDismissTo };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

type Settings = { rounds: number };
type GameState = { screen: string };
type State = RoomStoreState<Settings, GameState>;

const arrivedAt = (millis: number) => ({ toMillis: () => millis }) as never;

const makeStore = (overrides: Partial<State> = {}) =>
  create<State>()(() => ({
    code: 'tabofuna',
    players: {},
    hostUid: null,
    roomExists: true,
    roomSettings: null,
    gameState: { screen: 'playing' },
    reaction: null,
    localUid: null,
    connectionLost: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    markConnectionLost: jest.fn(),
    markVoluntaryLeave: jest.fn(),
    consumeVoluntaryLeave: jest.fn(() => false),
    ...overrides,
  }));

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
  const hook = await renderHook(() => useOnlineRoomSession(store, roomApi, 'tabofuna', onQuit));
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
    await act(async () => store.setState({ gameState: { screen: 'options' } }));
    expect(onQuit).toHaveBeenCalledTimes(1);
    await act(async () => store.setState({ players: {} }));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it('does not step off when the store was disconnected (its reset state is also the lobby)', async () => {
    const { store, onQuit } = await setup({ hostUid: 'zoe', localUid: 'zoe' });
    await act(async () => store.setState({ code: null, gameState: { screen: 'options' } }));
    expect(onQuit).not.toHaveBeenCalled();
  });

  it('does not step off when the room is gone', async () => {
    const { store, onQuit } = await setup({ hostUid: 'zoe', localUid: 'max' });
    await act(async () => store.setState({ roomExists: false, gameState: { screen: 'options' } }));
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
