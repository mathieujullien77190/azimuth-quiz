import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { useHeading } from './useHeading';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  watchHeadingAsync: jest.fn(),
}));

const mockedLocation = Location as jest.Mocked<typeof Location>;

describe('useHeading — disabled', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  it('returns a null heading and a no-op onTouch, whatever the platform', async () => {
    Platform.OS = 'ios';
    const { result } = await renderHook(() => useHeading(false));
    expect(result.current.heading).toBeNull();
    expect(() => result.current.onTouch()).not.toThrow();
    expect(result.current.heading).toBeNull();
    expect(mockedLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('useHeading — native sensor', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'ios';
    jest.clearAllMocks();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('subscribes and reports the true heading when permission is granted', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.watchHeadingAsync.mockImplementation(async (callback) => {
      (callback as (reading: { trueHeading: number; magHeading: number }) => void)({
        trueHeading: 42,
        magHeading: -1,
      });
      return { remove: jest.fn() } as never;
    });

    const { result } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(result.current.heading).toBe(42));
  });

  it('falls back to the magnetic heading when the true heading is unavailable', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.watchHeadingAsync.mockImplementation(async (callback) => {
      (callback as (reading: { trueHeading: number; magHeading: number }) => void)({
        trueHeading: -1,
        magHeading: 88,
      });
      return { remove: jest.fn() } as never;
    });

    const { result } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(result.current.heading).toBe(88));
  });

  it('stays null and does not subscribe when permission is refused', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);

    const { result } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalled());
    expect(result.current.heading).toBeNull();
    expect(mockedLocation.watchHeadingAsync).not.toHaveBeenCalled();
  });

  it('stays null when the permission request throws', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockRejectedValue(new Error('no sensor'));

    const { result } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalled());
    expect(result.current.heading).toBeNull();
  });

  it('removes the subscription on unmount', async () => {
    const remove = jest.fn();
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.watchHeadingAsync.mockResolvedValue({ remove } as never);

    const { unmount } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(mockedLocation.watchHeadingAsync).toHaveBeenCalled());
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('removes a subscription that only resolves after the hook has already unmounted', async () => {
    let resolveWatch!: (subscription: { remove: () => void }) => void;
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
    mockedLocation.watchHeadingAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWatch = resolve as never;
        }) as never,
    );

    const { unmount } = await renderHook(() => useHeading(true));
    await waitFor(() => expect(mockedLocation.watchHeadingAsync).toHaveBeenCalled());
    await unmount();

    const remove = jest.fn();
    resolveWatch({ remove });
    await waitFor(() => expect(remove).toHaveBeenCalled());
  });
});

describe('useHeading — web (deviceorientation)', () => {
  const originalOS = Platform.OS;
  let listeners: Record<string, (event: Event) => void>;
  let fakeWindow: {
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
    ondeviceorientationabsolute?: null;
    DeviceOrientationEvent?: { requestPermission: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
    listeners = {};
    fakeWindow = {
      addEventListener: jest.fn((name: string, handler: (event: Event) => void) => {
        listeners[name] = handler;
      }),
      removeEventListener: jest.fn((name: string) => {
        delete listeners[name];
      }),
    };
    (globalThis as { window?: unknown }).window = fakeWindow;
  });

  afterEach(async () => {
    // Le nettoyage local (et notamment la suppression de `window`) doit se produire avant le
    // cleanup automatique de testing-library : sinon le demontage des hooks encore montes,
    // declenche par ce cleanup global, tombe sur `window` deja supprime.
    await cleanup();
    Platform.OS = originalOS;
    delete (globalThis as { window?: unknown }).window;
    jest.clearAllMocks();
  });

  it('does not attach a listener until the compass is touched', async () => {
    const { result } = await renderHook(() => useHeading(true));
    expect(result.current.heading).toBeNull();
    expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
    expect(mockedLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('attaches a plain deviceorientation listener when the browser has no absolute event', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('deviceorientation', expect.any(Function));
  });

  it('prefers the absolute event name when the browser supports it', async () => {
    fakeWindow.ondeviceorientationabsolute = null;
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    expect(fakeWindow.addEventListener).toHaveBeenCalledWith('deviceorientationabsolute', expect.any(Function));
  });

  it('does not attach a second listener on repeated touches', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    result.current.onTouch();
    expect(fakeWindow.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('reads the Safari webkitCompassHeading field directly', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    await act(() => listeners.deviceorientation({ webkitCompassHeading: 77 } as never));
    await waitFor(() => expect(result.current.heading).toBe(77));
  });

  it('derives the heading from an absolute alpha event (Android)', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    await act(() => listeners.deviceorientation({ absolute: true, alpha: 30 } as never));
    await waitFor(() => expect(result.current.heading).toBe(330));
  });

  it('ignores non-absolute events', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    listeners.deviceorientation({ absolute: false, alpha: 30 } as never);
    expect(result.current.heading).toBeNull();
  });

  it('ignores absolute events without an alpha value', async () => {
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    listeners.deviceorientation({ absolute: true, alpha: null } as never);
    expect(result.current.heading).toBeNull();
  });

  it('requests permission before attaching when the browser requires it, and attaches once granted', async () => {
    const requestPermission = jest.fn().mockResolvedValue('granted');
    fakeWindow.DeviceOrientationEvent = { requestPermission };
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    await waitFor(() => expect(fakeWindow.addEventListener).toHaveBeenCalled());
  });

  it('does not attach when permission is denied', async () => {
    const requestPermission = jest.fn().mockResolvedValue('denied');
    fakeWindow.DeviceOrientationEvent = { requestPermission };
    const { result } = await renderHook(() => useHeading(true));
    result.current.onTouch();
    await waitFor(() => expect(requestPermission).toHaveBeenCalled());
    expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
  });

  it('swallows a permission request rejection', async () => {
    const requestPermission = jest.fn().mockRejectedValue(new Error('nope'));
    fakeWindow.DeviceOrientationEvent = { requestPermission };
    const { result } = await renderHook(() => useHeading(true));
    expect(() => result.current.onTouch()).not.toThrow();
    await waitFor(() => expect(requestPermission).toHaveBeenCalled());
    expect(fakeWindow.addEventListener).not.toHaveBeenCalled();
  });

  it('detaches the listener when disabled', async () => {
    const { result, rerender } = await renderHook(({ enabled }: { enabled: boolean }) => useHeading(enabled), {
      initialProps: { enabled: true },
    });
    result.current.onTouch();
    expect(fakeWindow.addEventListener).toHaveBeenCalledTimes(1);

    await rerender({ enabled: false });
    expect(fakeWindow.removeEventListener).toHaveBeenCalledTimes(1);
    expect(result.current.heading).toBeNull();
  });
});
