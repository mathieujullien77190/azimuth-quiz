import { act, renderHook } from '@testing-library/react-native';

import { useRoomStore } from '@/store/roomStore';
import type { RoomPlayers } from '../../firebase/roomApi';
import { useRoomPresence } from '../useRoomPresence';

// `room.ts` charge `firebase/firestore` (ESM seul, plante Jest) : le store n'ouvre ici aucun abonnement.
jest.mock('@/games/firebase/room', () => ({}));

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
