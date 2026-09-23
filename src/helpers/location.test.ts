import * as Location from 'expo-location';

import { DEFAULT_ORIGIN } from '@/constants';

import { resolveOrigin } from './location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const mockedLocation = Location as jest.Mocked<typeof Location>;

describe('resolveOrigin', () => {
  it('returns DEFAULT_ORIGIN when permission is refused', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);

    const origin = await resolveOrigin('ta position');
    expect(origin).toEqual(DEFAULT_ORIGIN);
  });

  it('uses the last known position when available, without asking for a fresh fix', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.getLastKnownPositionAsync.mockResolvedValue({
      coords: { latitude: 35.6762, longitude: 139.6503 },
    } as never);

    const origin = await resolveOrigin('ta position');
    expect(origin).toEqual({
      name: 'ta position',
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      isDevicePosition: true,
    });
    expect(mockedLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('falls back to a fresh fix when no last known position exists', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.getLastKnownPositionAsync.mockResolvedValue(null as never);
    mockedLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 1, longitude: 2 },
    } as never);

    const origin = await resolveOrigin('ta position');
    expect(origin.coordinates).toEqual({ latitude: 1, longitude: 2 });
    expect(origin.isDevicePosition).toBe(true);
  });

  it('returns DEFAULT_ORIGIN when the underlying calls throw', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockRejectedValue(new Error('no sensor'));

    const origin = await resolveOrigin('ta position');
    expect(origin).toEqual(DEFAULT_ORIGIN);
  });

  it('returns DEFAULT_ORIGIN when resolution takes longer than the timeout', async () => {
    jest.useFakeTimers();
    mockedLocation.requestForegroundPermissionsAsync.mockReturnValue(new Promise(() => {}) as never);

    const promise = resolveOrigin('ta position');
    jest.runAllTimers();
    await expect(promise).resolves.toEqual(DEFAULT_ORIGIN);
    jest.useRealTimers();
  });
});
