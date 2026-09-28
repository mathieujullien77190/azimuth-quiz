import { renderHook } from '@testing-library/react-native';

import { DEFAULT_CONTOUR_SETTINGS } from '@/games/contour/constants';
import { startContourRoomGame } from '@/games/contour/helpers/room';
import { useContourRoomStore } from '@/games/contour/store/roomStore';

import { useOnlineContourRoom } from './useOnlineContourRoom';

jest.mock('@/components/setup/useSetupRoom', () => ({
  useSetupRoom: () => ({ startOnlineGame: (run: (code: string) => Promise<void>) => run('tabofuna') }),
}));
jest.mock('@/games/contour/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  startContourRoomGame: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/games/contour/store/roomStore', () => ({ useContourRoomStore: { getState: jest.fn() } }));

const arrivedAt = (millis: number) => ({ toMillis: () => millis });

beforeEach(() => jest.clearAllMocks());

describe('useOnlineContourRoom', () => {
  it('starts the room game with one country code per round and the first player to arrive', async () => {
    jest.mocked(useContourRoomStore.getState).mockReturnValue({
      players: {
        late: { name: 'Late', joinedAt: arrivedAt(20) },
        early: { name: 'Early', joinedAt: arrivedAt(10) },
      },
    } as never);
    const settings = { ...DEFAULT_CONTOUR_SETTINGS, rounds: 3 };
    const { result } = await renderHook(() => useOnlineContourRoom(settings, jest.fn()));

    await result.current.startOnlineContourGame();

    expect(startContourRoomGame).toHaveBeenCalledTimes(1);
    const [code, countryCodes, firstTurnUid, simplifySeed] = jest.mocked(startContourRoomGame).mock
      .calls[0] as unknown as [string, string[], string, number];
    expect(code).toBe('tabofuna');
    expect(countryCodes).toHaveLength(3);
    expect(firstTurnUid).toBe('early');
    // The host draws the room-wide seed of the silhouettes' simplification.
    expect(Number.isInteger(simplifySeed)).toBe(true);
  });

  it('refuses to start when nobody is in the room', async () => {
    jest.mocked(useContourRoomStore.getState).mockReturnValue({ players: {} } as never);
    const { result } = await renderHook(() => useOnlineContourRoom(DEFAULT_CONTOUR_SETTINGS, jest.fn()));

    await expect(result.current.startOnlineContourGame()).rejects.toThrow('no player in the room');
    expect(startContourRoomGame).not.toHaveBeenCalled();
  });
});
