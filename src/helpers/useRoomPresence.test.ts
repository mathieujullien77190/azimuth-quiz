import { act, renderHook } from '@testing-library/react-native';

import { createRoomStore } from './createRoomStore';
import type { RoomPlayers } from './roomBase';
import { useRoomPresence } from './useRoomPresence';

const noSubscription = () => () => {};
const makeStore = () =>
  createRoomStore<object, { screen: string }>({
    defaultGameState: { screen: 'options' },
    subscribeToRoomPlayers: noSubscription,
    subscribeToRoomSettings: noSubscription,
    subscribeToRoomGame: noSubscription,
  });

const seen = (millis: number) => ({ toMillis: () => millis }) as never;
const player = (name: string, lastSeen?: number) => ({
  name,
  joinedAt: null,
  ...(lastSeen === undefined ? {} : { lastSeen: seen(lastSeen) }),
});

const SEC = 1000;

const setup = async ({ me, players, screen = 'game' }: { me: string; players: RoomPlayers; screen?: string }) => {
  const store = makeStore();
  store.setState({ localUid: me, hostUid: 'host', players, gameState: { screen } });
  const api = {
    sendHeartbeat: jest.fn(() => Promise.resolve()),
    deleteRoom: jest.fn(() => Promise.resolve()),
    removeRoomPlayer: jest.fn(() => Promise.resolve()),
  };
  await renderHook(() => useRoomPresence(store, api, 'room'));
  return { store, api };
};

/** Advances time in 10s steps (the check period), so every interval gets to run in order. */
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
    const { store, api } = await setup({
      me: 'max',
      players: { host: player('Zoé', 1), max: player('Max') },
    });
    await advance(80);
    expect(store.getState().connectionLost).toBe(false);
    await advance(30);
    expect(store.getState().connectionLost).toBe(true);
    expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
    expect(api.deleteRoom).not.toHaveBeenCalled();
  });

  it('a host that keeps seeing the joiner’s heartbeat changes never loses it', async () => {
    const { store, api } = await setup({
      me: 'host',
      players: { host: player('Zoé'), max: player('Max', 1) },
    });
    for (let beat = 2; beat < 8; beat += 1) {
      await advance(30);
      await act(async () => store.setState({ players: { host: player('Zoé'), max: player('Max', beat) } }));
    }
    expect(api.removeRoomPlayer).not.toHaveBeenCalled();
    expect(store.getState().connectionLost).toBe(false);
  });

  it('the host removes a joiner that went silent for 90s, and the game goes on', async () => {
    const { store, api } = await setup({
      me: 'host',
      players: { host: player('Zoé'), max: player('Max', 1) },
    });
    await advance(110);
    expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
    expect(store.getState().connectionLost).toBe(false);
  });

  it('leaves when its own heartbeat is never acknowledged (host: deletes the room)', async () => {
    const store = makeStore();
    store.setState({
      localUid: 'host',
      hostUid: 'host',
      players: { host: player('Zoé'), max: player('Max', 1) },
      gameState: { screen: 'game' },
    });
    const api = {
      sendHeartbeat: jest.fn(() => new Promise<void>(() => {})),
      deleteRoom: jest.fn(() => Promise.resolve()),
      removeRoomPlayer: jest.fn(() => Promise.resolve()),
    };
    await renderHook(() => useRoomPresence(store, api, 'room'));
    // The joiner keeps beating, only this device's own writes never come back.
    for (let second = 10; second <= 110; second += 10) {
      await advance(10);
      await act(async () => store.setState({ players: { host: player('Zoé'), max: player('Max', second) } }));
    }
    expect(store.getState().connectionLost).toBe(true);
    expect(api.deleteRoom).toHaveBeenCalledWith('room');
  });

  it('does not mistake a suspended device (background, locked screen) for a lost connection', async () => {
    const { store, api } = await setup({
      me: 'max',
      players: { host: player('Zoé', 1), max: player('Max') },
    });
    await advance(20);
    // The whole app was frozen for 5 minutes: no timer ran meanwhile.
    jest.setSystemTime(Date.now() + 300 * SEC);
    await advance(10);
    expect(store.getState().connectionLost).toBe(false);
    expect(api.removeRoomPlayer).not.toHaveBeenCalled();
  });
});

describe('useRoomPresence — edge cases', () => {
  const setupWith = async (me: string, players: RoomPlayers, api: Record<string, jest.Mock>) => {
    const store = makeStore();
    store.setState({ localUid: me, hostUid: 'host', players, gameState: { screen: 'game' } });
    await renderHook(() => useRoomPresence(store, api as never, 'room'));
    return store;
  };
  const failingApi = () => ({
    sendHeartbeat: jest.fn(() => Promise.resolve()),
    deleteRoom: jest.fn(() => Promise.reject(new Error('gone'))),
    removeRoomPlayer: jest.fn(() => Promise.reject(new Error('gone'))),
  });

  it('a host that never wrote a heartbeat counts as silent too', async () => {
    const { store } = await setup({ me: 'max', players: { host: player('Zoé'), max: player('Max') } });
    await advance(110);
    expect(store.getState().connectionLost).toBe(true);
  });

  it('forgets a player that left the room instead of judging it later', async () => {
    const { store, api } = await setup({
      me: 'host',
      players: { host: player('Zoé'), max: player('Max', 1) },
    });
    await advance(60);
    await act(async () => store.setState({ players: { host: player('Zoé') } }));
    await advance(60);
    expect(api.removeRoomPlayer).not.toHaveBeenCalled();
  });

  it('keeps judging the others once one of several players left', async () => {
    const { store, api } = await setup({
      me: 'host',
      players: { host: player('Zoé'), max: player('Max', 1), eve: player('Eve', 1) },
    });
    await advance(60);
    // Max leaves; Eve is still there and stays silent.
    await act(async () => store.setState({ players: { host: player('Zoé'), eve: player('Eve', 1) } }));
    await advance(60);
    expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'eve');
    expect(api.removeRoomPlayer).not.toHaveBeenCalledWith('room', 'max');
  });

  it('survives a heartbeat that is rejected', async () => {
    const api = failingApi();
    api.sendHeartbeat = jest.fn(() => Promise.reject(new Error('offline')));
    const store = await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
    await advance(30);
    expect(api.sendHeartbeat).toHaveBeenCalled();
    expect(store.getState().connectionLost).toBe(false);
  });

  it('a joiner survives a failing presence removal when leaving', async () => {
    const api = failingApi();
    const store = await setupWith('max', { host: player('Zoé', 1), max: player('Max') }, api);
    await advance(110);
    expect(store.getState().connectionLost).toBe(true);
    expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
  });

  it('a host survives a failing room deletion when leaving', async () => {
    const api = failingApi();
    api.sendHeartbeat = jest.fn(() => new Promise<void>(() => {}));
    const store = await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
    for (let second = 10; second <= 110; second += 10) {
      await advance(10);
      await act(async () => store.setState({ players: { host: player('Zoé'), max: player('Max', second) } }));
    }
    expect(store.getState().connectionLost).toBe(true);
    expect(api.deleteRoom).toHaveBeenCalledWith('room');
  });

  it('a host survives a failing removal of a silent joiner', async () => {
    const api = failingApi();
    const store = await setupWith('host', { host: player('Zoé'), max: player('Max', 1) }, api);
    await advance(110);
    expect(api.removeRoomPlayer).toHaveBeenCalledWith('room', 'max');
    expect(store.getState().connectionLost).toBe(false);
  });
});
