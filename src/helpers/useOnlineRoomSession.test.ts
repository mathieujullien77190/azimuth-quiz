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
