import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { DEFAULT_ORIGIN } from '@/data';

import {
  disableTextSelection,
  flagEmoji,
  goBackOrHome,
  noPageScroll,
  polyfillFlagEmoji,
  resolveOrigin,
} from '../platform';

jest.mock('country-flag-emoji-polyfill', () => ({ polyfillCountryFlagEmojis: jest.fn() }));

describe('disableTextSelection', () => {
  const originalOS = Platform.OS;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    Platform.OS = originalOS;
    (globalThis as { document?: unknown }).document = originalDocument;
  });

  it('does nothing on native (no document to touch)', () => {
    Platform.OS = 'ios';
    expect(() => disableTextSelection()).not.toThrow();
  });

  it('does nothing when document is unavailable, even on web', () => {
    Platform.OS = 'web';
    (globalThis as { document?: unknown }).document = undefined;
    expect(() => disableTextSelection()).not.toThrow();
  });

  it('injects a <style> tag once on web', () => {
    Platform.OS = 'web';
    const appended: HTMLElement[] = [];
    const elementsById = new Map<string, unknown>();
    const fakeStyle = { id: '', textContent: '' };
    const fakeDocument = {
      getElementById: (id: string) => elementsById.get(id) ?? null,
      createElement: () => fakeStyle,
      head: {
        appendChild: (el: HTMLElement) => {
          appended.push(el);
          elementsById.set(fakeStyle.id, fakeStyle);
        },
      },
    };
    (globalThis as { document?: unknown }).document = fakeDocument;

    disableTextSelection();
    expect(appended).toHaveLength(1);
    expect(fakeStyle.id).toBe('azimuthquiz-no-select');
    expect(fakeStyle.textContent).toContain('user-select: none');
  });

  it('is a no-op the second time (style tag already present)', () => {
    Platform.OS = 'web';
    const elementsById = new Map<string, unknown>();
    elementsById.set('azimuthquiz-no-select', {});
    const appendChild = jest.fn();
    (globalThis as { document?: unknown }).document = {
      getElementById: (id: string) => elementsById.get(id) ?? null,
      createElement: () => ({ id: '', textContent: '' }),
      head: { appendChild },
    };

    disableTextSelection();
    expect(appendChild).not.toHaveBeenCalled();
  });
});

describe('polyfillFlagEmoji', () => {
  const originalOS = Platform.OS;
  const originalDocument = (globalThis as { document?: unknown }).document;

  afterEach(() => {
    Platform.OS = originalOS;
    (globalThis as { document?: unknown }).document = originalDocument;
    jest.clearAllMocks();
  });

  it('does nothing on native (no document to touch)', () => {
    Platform.OS = 'ios';
    expect(() => polyfillFlagEmoji()).not.toThrow();
    expect(polyfillCountryFlagEmojis).not.toHaveBeenCalled();
  });

  it('does nothing when document is unavailable, even on web', () => {
    Platform.OS = 'web';
    (globalThis as { document?: unknown }).document = undefined;
    polyfillFlagEmoji();
    expect(polyfillCountryFlagEmojis).not.toHaveBeenCalled();
  });

  it('injects the fallback font on web', () => {
    Platform.OS = 'web';
    (globalThis as { document?: unknown }).document = {};
    polyfillFlagEmoji();
    expect(polyfillCountryFlagEmojis).toHaveBeenCalledTimes(1);
  });
});

describe('noPageScroll', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('takes the touch for itself on the web', () => {
    Platform.OS = 'web';
    expect(noPageScroll()).toEqual({ touchAction: 'none' });
  });

  it('is nothing on a phone, where there is no page to scroll', () => {
    Platform.OS = 'android';
    expect(noPageScroll()).toBeUndefined();
  });
});

describe('flagEmoji', () => {
  it('builds the flag from the two letters of the country code, whatever the case', () => {
    expect(flagEmoji('FR')).toBe('🇫🇷');
    expect(flagEmoji('gb')).toBe('🇬🇧');
  });
});

const routerWith = (canGoBack: boolean) => ({ canGoBack: () => canGoBack, back: jest.fn(), replace: jest.fn() });

describe('goBackOrHome', () => {
  it('goes one step back when there is a history', () => {
    const router = routerWith(true);
    goBackOrHome(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('goes home instead when there is nowhere to go back to', () => {
    const router = routerWith(false);
    goBackOrHome(router);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });
});

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
