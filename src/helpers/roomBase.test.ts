import { collection, deleteDoc, getDoc, getDocs, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { generateRoomCode, getLocalUid, loadMyRoomCode, saveMyRoomCode } from '@/helpers/roomCode';

import { ROOM_MAX_PLAYERS, createRoomApi, type RoomPlayers } from './roomBase';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db, name: string) => ({ collectionName: name })),
  deleteDoc: jest.fn(() => Promise.resolve()),
  deleteField: jest.fn(() => 'DELETE_FIELD'),
  doc: jest.fn((_db, collectionName: string, code: string) => ({ path: `${collectionName}/${code}` })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn((...args) => ({ query: args })),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  where: jest.fn((...args) => ({ where: args })),
}));
jest.mock('@/helpers/firebase', () => ({ db: {} }));
jest.mock('@/helpers/roomCode', () => ({
  generateRoomCode: jest.fn(),
  getLocalUid: jest.fn(),
  loadMyRoomCode: jest.fn(),
  saveMyRoomCode: jest.fn(),
}));

type Settings = { rounds: number };
const api = createRoomApi<Settings>('compass');

const snapshot = (data: Record<string, unknown> | undefined) => ({
  exists: () => data !== undefined,
  data: () => data,
});
const player = (name: string, extra: Partial<RoomPlayers[string]> = {}) => ({ name, joinedAt: null, ...extra });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getLocalUid).mockResolvedValue('zoe');
  jest.mocked(loadMyRoomCode).mockResolvedValue(null);
  jest.mocked(saveMyRoomCode).mockResolvedValue();
  jest.mocked(getDocs).mockResolvedValue({ docs: [] } as never);
});

const joinWith = async (players: RoomPlayers, name = 'Zoe') => {
  jest.mocked(getDoc).mockResolvedValue(snapshot({ players }) as never);
  await api.joinRoomPresence('tabofuna', name);
  return jest.mocked(updateDoc).mock.calls[0]?.[1] as unknown as Record<string, unknown> | undefined;
};

describe('createRoom', () => {
  it('stamps the room with the host uid and settings, and returns its code', async () => {
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);

    await expect(api.createRoom({ rounds: 5 })).resolves.toBe('tabofuna');

    expect(setDoc).toHaveBeenCalledWith(
      { path: 'rooms/tabofuna' },
      { createdAt: 'SERVER_TIMESTAMP', hostUid: 'zoe', game: 'compass', settings: { rounds: 5 } },
    );
  });

  it('remembers the code it ends up using', async () => {
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);
    await api.createRoom({ rounds: 5 });
    expect(saveMyRoomCode).toHaveBeenCalledWith('tabofuna');
  });

  it('offers the code this device used last when it is free, without drawing a new one', async () => {
    jest.mocked(loadMyRoomCode).mockResolvedValue('bagubaku');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);
    await expect(api.createRoom({ rounds: 5 })).resolves.toBe('bagubaku');
    expect(generateRoomCode).not.toHaveBeenCalled();
  });

  it('draws a fresh code when the remembered one is taken by someone else', async () => {
    jest.mocked(loadMyRoomCode).mockResolvedValue('bagubaku');
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest
      .mocked(getDoc)
      .mockResolvedValueOnce(snapshot({}) as never)
      .mockResolvedValueOnce(snapshot(undefined) as never);
    await expect(api.createRoom({ rounds: 5 })).resolves.toBe('tabofuna');
  });

  it('retries with a fresh code on a collision', async () => {
    jest.mocked(generateRoomCode).mockReturnValueOnce('kilobani').mockReturnValueOnce('tabofuna');
    jest
      .mocked(getDoc)
      .mockResolvedValueOnce(snapshot({}) as never)
      .mockResolvedValueOnce(snapshot(undefined) as never);

    await expect(api.createRoom({ rounds: 5 })).resolves.toBe('tabofuna');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it('first deletes every room this uid hosted before', async () => {
    const stale = [{ ref: { path: 'rooms/old1' } }, { ref: { path: 'rooms/old2' } }];
    jest.mocked(getDocs).mockResolvedValue({ docs: stale } as never);
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);

    await api.createRoom({ rounds: 5 });

    expect(deleteDoc).toHaveBeenCalledWith({ path: 'rooms/old1' });
    expect(deleteDoc).toHaveBeenCalledWith({ path: 'rooms/old2' });
  });
});

describe('roomExists', () => {
  it('reflects whether a room of this game exists under the code', async () => {
    jest
      .mocked(getDoc)
      .mockResolvedValueOnce(snapshot({ game: 'compass' }) as never)
      .mockResolvedValueOnce(snapshot(undefined) as never);
    await expect(api.roomExists('tabofuna')).resolves.toBe(true);
    await expect(api.roomExists('kilobani')).resolves.toBe(false);
  });

  it("does not count another game's room, nor a room with no game (created before the games were merged)", async () => {
    jest
      .mocked(getDoc)
      .mockResolvedValueOnce(snapshot({ game: 'clues' }) as never)
      .mockResolvedValueOnce(snapshot({}) as never);
    await expect(api.roomExists('tabofuna')).resolves.toBe(false);
    await expect(api.roomExists('kilobani')).resolves.toBe(false);
  });
});

describe('one collection for every game', () => {
  it('stamps each game on its rooms, all in the same collection', async () => {
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);
    for (const game of ['compass', 'clues'] as const) {
      await createRoomApi<Settings>(game).createRoom({ rounds: 5 });
    }
    expect(setDoc).toHaveBeenNthCalledWith(1, { path: 'rooms/tabofuna' }, expect.objectContaining({ game: 'compass' }));
    expect(setDoc).toHaveBeenNthCalledWith(2, { path: 'rooms/tabofuna' }, expect.objectContaining({ game: 'clues' }));
  });

  it("clears a host's previous rooms whatever their game", async () => {
    jest.mocked(generateRoomCode).mockReturnValue('tabofuna');
    jest.mocked(getDoc).mockResolvedValue(snapshot(undefined) as never);
    await createRoomApi<Settings>('clues').createRoom({ rounds: 5 });
    expect(collection).toHaveBeenCalledWith(expect.anything(), 'rooms');
  });
});

describe('simple room writes', () => {
  it('updateRoomSettings writes the settings', async () => {
    await api.updateRoomSettings('tabofuna', { rounds: 8 });
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { settings: { rounds: 8 } });
  });

  it('removeRoomPlayer deletes that player entry', async () => {
    await api.removeRoomPlayer('tabofuna', 'max');
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { 'players.max': 'DELETE_FIELD' });
  });

  it('pruneRoomPlayerData erases each given uid from each given map', async () => {
    await api.pruneRoomPlayerData('tabofuna', { guesses: ['eve'], totalScores: ['eve', 'ghost'] });
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'rooms/tabofuna' },
      { 'guesses.eve': 'DELETE_FIELD', 'totalScores.eve': 'DELETE_FIELD', 'totalScores.ghost': 'DELETE_FIELD' },
    );
  });

  it('pruneRoomPlayerData writes nothing when there is nothing to erase', async () => {
    await api.pruneRoomPlayerData('tabofuna', {});
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('deleteRoom deletes the room document', async () => {
    await api.deleteRoom('tabofuna');
    expect(deleteDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' });
  });

  it('sendHeartbeat bumps this player lastSeen with a server timestamp', async () => {
    await api.sendHeartbeat('tabofuna', 'zoe');
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { 'players.zoe.lastSeen': 'SERVER_TIMESTAMP' });
  });

  it('passRoomTurn writes the new turn owner', async () => {
    await api.passRoomTurn('tabofuna', 'max');
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { turnUid: 'max' });
  });

  it('updateRoomPlayerColors writes one color field per player', async () => {
    await api.updateRoomPlayerColors('tabofuna', { zoe: 'red', max: 'blue' });
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'rooms/tabofuna' },
      { 'players.zoe.color': 'red', 'players.max.color': 'blue' },
    );
  });

  it('updateRoomPlayerColors is a no-op on an empty map', async () => {
    await api.updateRoomPlayerColors('tabofuna', {});
    expect(updateDoc).not.toHaveBeenCalled();
  });
});

describe('joinRoomPresence', () => {
  it('returns the local uid and writes name + joinedAt as separate field paths', async () => {
    jest.mocked(getDoc).mockResolvedValue(snapshot({ players: {} }) as never);
    await expect(api.joinRoomPresence('tabofuna', 'Zoe')).resolves.toBe('zoe');
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'rooms/tabofuna' },
      { 'players.zoe.name': 'Zoe', 'players.zoe.joinedAt': 'SERVER_TIMESTAMP' },
    );
  });

  it('copes with a room without players yet', async () => {
    jest.mocked(getDoc).mockResolvedValue(snapshot({}) as never);
    await api.joinRoomPresence('tabofuna', 'Zoe');
    expect(updateDoc).toHaveBeenCalledTimes(1);
  });

  it('keeps the original joinedAt when this device already is in the room', async () => {
    const joinedAt = { toMillis: () => 1 };
    const updates = await joinWith({ zoe: player('Zoe', { joinedAt: joinedAt as never }) });
    expect(updates?.['players.zoe.joinedAt']).toBe(joinedAt);
  });

  it('refuses a name another player already has, and writes nothing', async () => {
    jest.mocked(getDoc).mockResolvedValue(snapshot({ players: { max: player('Zoe') } }) as never);
    await expect(api.joinRoomPresence('tabofuna', 'zoe ')).rejects.toMatchObject({ code: 'name-taken' });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('lets a player keep, or re-register with, its own name', async () => {
    const updates = await joinWith({ zoe: player('Zoe') });
    expect(updates?.['players.zoe.name']).toBe('Zoe');
  });

  it('accepts a name that only looks like a taken one', async () => {
    const updates = await joinWith({ max: player('Zoe1') }, 'Zoe');
    expect(updates?.['players.zoe.name']).toBe('Zoe');
  });

  it('does nothing past the player cap for a device that is not already in', async () => {
    const full: RoomPlayers = Object.fromEntries(
      Array.from({ length: ROOM_MAX_PLAYERS }, (_, index) => [`p${index}`, player(`P${index}`)]),
    );
    const updates = await joinWith(full);
    expect(updates).toBeUndefined();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('still lets a device already in a full room refresh its presence', async () => {
    const full: RoomPlayers = Object.fromEntries(
      Array.from({ length: ROOM_MAX_PLAYERS - 1 }, (_, index) => [`p${index}`, player(`P${index}`)]),
    );
    const updates = await joinWith({ ...full, zoe: player('Zoe') });
    expect(updates?.['players.zoe.name']).toBe('Zoe');
  });
});

describe('subscriptions', () => {
  const emit = (data: Record<string, unknown> | undefined) => {
    const unsubscribe = jest.fn();
    jest.mocked(onSnapshot).mockImplementation(((_ref: unknown, callback: (value: unknown) => void) => {
      callback(snapshot(data));
      return unsubscribe;
    }) as never);
    return unsubscribe;
  };

  it('subscribeToRoomSettings forwards the settings and returns the unsubscribe', () => {
    const unsubscribe = emit({ settings: { rounds: 7 } });
    const onSettings = jest.fn();
    expect(api.subscribeToRoomSettings('tabofuna', onSettings)).toBe(unsubscribe);
    expect(onSettings).toHaveBeenCalledWith({ rounds: 7 });
  });

  it('subscribeToRoomSettings ignores a room without settings', () => {
    emit(undefined);
    const onSettings = jest.fn();
    api.subscribeToRoomSettings('tabofuna', onSettings);
    expect(onSettings).not.toHaveBeenCalled();
  });

  it('subscribeToRoomPlayers forwards players, host, existence and screen', () => {
    emit({ players: { zoe: player('Zoe') }, hostUid: 'zoe', screen: 'game' });
    const onUpdate = jest.fn();
    api.subscribeToRoomPlayers('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({ zoe: player('Zoe') }, 'zoe', true, 'game', null);
  });

  it('subscribeToRoomPlayers forwards the latest reaction', () => {
    const reaction = { uid: 'zoe', emoji: '🔥', seq: 7 };
    emit({ players: {}, hostUid: 'zoe', reaction });
    const onUpdate = jest.fn();
    api.subscribeToRoomPlayers('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({}, 'zoe', true, 'options', reaction);
  });

  it('subscribeToRoomPlayers defaults for a deleted room', () => {
    emit(undefined);
    const onUpdate = jest.fn();
    api.subscribeToRoomPlayers('tabofuna', onUpdate);
    expect(onUpdate).toHaveBeenCalledWith({}, undefined, false, 'options', null);
  });
});

describe('restartRoom', () => {
  it('sends the room back to its lobby, touching nothing else', async () => {
    await api.restartRoom('tabofuna');
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { screen: 'options' });
  });
});

describe('sendReaction', () => {
  it("overwrites the room's single reaction field with this device, the emoji and the time", async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234);
    await api.sendReaction('tabofuna', '🔥');
    expect(updateDoc).toHaveBeenCalledWith({ path: 'rooms/tabofuna' }, { reaction: { uid: 'zoe', emoji: '🔥', seq: 1234 } });
    jest.restoreAllMocks();
  });
});
