import { renderHook } from '@testing-library/react-native';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { startClueRoomGame } from '@/games/clues/helpers/room';
import { useClueRoomStore } from '@/games/clues/store/roomStore';
import { resolveOrigin } from '@/helpers';

import { useOnlineClueRoom } from './useOnlineClueRoom';

jest.mock('@/components/setup/useSetupRoom', () => ({
  useSetupRoom: () => ({ startOnlineGame: (run: (code: string) => Promise<void>) => run('tabofuna') }),
}));
jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  resolveOrigin: jest.fn(),
}));
jest.mock('@/games/clues/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  startClueRoomGame: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/games/clues/store/roomStore', () => ({ useClueRoomStore: { getState: jest.fn() } }));

const ORIGIN = { name: 'Paris', coordinates: { latitude: 48.85, longitude: 2.35 }, isDevicePosition: false };
const arrivedAt = (millis: number) => ({ toMillis: () => millis });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(resolveOrigin).mockResolvedValue(ORIGIN);
});

describe('useOnlineClueRoom', () => {
  it('starts the room game with the origin, the drawn places and the first player to arrive', async () => {
    jest.mocked(useClueRoomStore.getState).mockReturnValue({
      players: {
        late: { name: 'Late', joinedAt: arrivedAt(20) },
        early: { name: 'Early', joinedAt: arrivedAt(10) },
      },
    } as never);
    const settings = { ...DEFAULT_CLUE_SETTINGS, rounds: 3, startWithFirstLetter: false };
    const { result } = await renderHook(() => useOnlineClueRoom(settings, jest.fn()));

    await result.current.startOnlineClueGame();

    expect(startClueRoomGame).toHaveBeenCalledTimes(1);
    const [code, payload, firstTurnUid, startWithFirstLetter] = jest.mocked(startClueRoomGame).mock
      .calls[0] as unknown as [string, { origin: unknown; places: unknown[] }, string, boolean];
    expect(code).toBe('tabofuna');
    expect(payload.origin).toBe(ORIGIN);
    expect(payload.places).toHaveLength(3);
    expect(firstTurnUid).toBe('early');
    expect(startWithFirstLetter).toBe(false);
  });

  it('refuses to start when nobody is in the room', async () => {
    jest.mocked(useClueRoomStore.getState).mockReturnValue({ players: {} } as never);
    const { result } = await renderHook(() => useOnlineClueRoom(DEFAULT_CLUE_SETTINGS, jest.fn()));

    await expect(result.current.startOnlineClueGame()).rejects.toThrow('no player in the room');
    expect(startClueRoomGame).not.toHaveBeenCalled();
  });
});
