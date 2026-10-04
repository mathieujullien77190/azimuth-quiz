import { renderHook } from '@testing-library/react-native';

import { DEFAULT_SETTINGS } from '@/games/compass/constants';
import { fetchRandomPlaces } from '@/games/compass/helpers/firestorePlaces';
import { startRoomGame } from '@/games/compass/helpers/room';
import { resolveOrigin } from '@/helpers';

import { useOnlineRoom } from './useOnlineRoom';

jest.mock('@/components/setup/useSetupRoom', () => ({
  useSetupRoom: () => ({ startOnlineGame: (run: (code: string) => Promise<void>) => run('tabofuna') }),
}));
jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  resolveOrigin: jest.fn(),
}));
jest.mock('@/games/compass/helpers/firestorePlaces', () => ({ fetchRandomPlaces: jest.fn() }));
jest.mock('@/games/compass/helpers/room', () => ({
  ROOM_MAX_PLAYERS: 10,
  startRoomGame: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/games/compass/store/roomStore', () => ({ useRoomStore: {} }));

const DEVICE_ORIGIN = { name: 'Ici', coordinates: { latitude: 1, longitude: 2 }, isDevicePosition: true };
const PLACES = [{ name: 'Rome' }];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(resolveOrigin).mockResolvedValue(DEVICE_ORIGIN);
  jest.mocked(fetchRandomPlaces).mockResolvedValue(PLACES as never);
});

describe('useOnlineRoom', () => {
  it('starts the room game from the device position when GPS is on', async () => {
    const settings = { ...DEFAULT_SETTINGS, useGps: true };
    const { result } = await renderHook(() => useOnlineRoom(settings, jest.fn()));

    await result.current.startOnlineGame();

    expect(resolveOrigin).toHaveBeenCalledTimes(1);
    expect(fetchRandomPlaces).toHaveBeenCalledWith(settings, 'fr');
    expect(startRoomGame).toHaveBeenCalledWith('tabofuna', { origin: DEVICE_ORIGIN, places: PLACES });
  });

  it('in travel mode, keeps a place from following itself', async () => {
    const rome = { name: 'Rome' };
    jest.mocked(fetchRandomPlaces).mockResolvedValue([rome, rome, { name: 'Oslo' }] as never);
    const settings = { ...DEFAULT_SETTINGS, useGps: true, travel: true };
    const { result } = await renderHook(() => useOnlineRoom(settings, jest.fn()));

    await result.current.startOnlineGame();

    expect(jest.mocked(startRoomGame).mock.calls[0][1].places).toEqual([rome, { name: 'Oslo' }, rome]);
  });

  it('starts from the custom coordinates, without asking the device, when GPS is off', async () => {
    const settings = { ...DEFAULT_SETTINGS, useGps: false, customLatitude: 10, customLongitude: 20 };
    const { result } = await renderHook(() => useOnlineRoom(settings, jest.fn()));

    await result.current.startOnlineGame();

    expect(resolveOrigin).not.toHaveBeenCalled();
    const origin = jest.mocked(startRoomGame).mock.calls[0][1].origin;
    expect(origin.coordinates).toEqual({ latitude: 10, longitude: 20 });
    expect(origin.isDevicePosition).toBe(false);
    expect(fetchRandomPlaces).toHaveBeenCalledWith(settings, 'fr');
  });

  it('starts nothing when the places cannot be drawn (the shared start flow reports the failure)', async () => {
    jest.mocked(fetchRandomPlaces).mockRejectedValue(new Error('offline'));
    const { result } = await renderHook(() => useOnlineRoom({ ...DEFAULT_SETTINGS, useGps: true }, jest.fn()));

    await expect(result.current.startOnlineGame()).rejects.toThrow('offline');

    expect(startRoomGame).not.toHaveBeenCalled();
  });
});
