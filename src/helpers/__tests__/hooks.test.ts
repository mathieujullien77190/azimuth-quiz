import { act, renderHook } from '@testing-library/react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';

import { useDebouncedValue, useImmersiveNavigationBar, useSplashGate } from '../hooks';

jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setHidden: jest.fn() } }));

{
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = (value: string) =>
    renderHook((props: { value: string }) => useDebouncedValue(props.value, 500), { initialProps: { value } });

  describe('useDebouncedValue', () => {
    it('starts with the value it is given', async () => {
      const { result } = await setup('Zoe');
      expect(result.current).toBe('Zoe');
    });

    it('follows a change once it has stayed still for the delay', async () => {
      const { result, rerender } = await setup('Zoe');
      await rerender({ value: 'Zoé' });
      expect(result.current).toBe('Zoe');
      await act(async () => jest.advanceTimersByTime(499));
      expect(result.current).toBe('Zoe');
      await act(async () => jest.advanceTimersByTime(1));
      expect(result.current).toBe('Zoé');
    });

    it('restarts the wait on every change, and only keeps the last value', async () => {
      const { result, rerender } = await setup('M');
      await rerender({ value: 'Ma' });
      await act(async () => jest.advanceTimersByTime(400));
      await rerender({ value: 'Max' });
      await act(async () => jest.advanceTimersByTime(400));
      expect(result.current).toBe('M');
      await act(async () => jest.advanceTimersByTime(100));
      expect(result.current).toBe('Max');
    });
  });
}

{
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const setup = async (ready: boolean) =>
    renderHook((props: { ready: boolean }) => useSplashGate(props.ready, 5000, 15000), { initialProps: { ready } });

  describe('useSplashGate', () => {
    it('stays up for the minimum time even when everything is ready at once', async () => {
      const { result } = await setup(true);
      expect(result.current).toBe(true);
      await act(async () => jest.advanceTimersByTime(4999));
      expect(result.current).toBe(true);
      await act(async () => jest.advanceTimersByTime(1));
      expect(result.current).toBe(false);
    });

    it('waits for the app to be ready when that takes longer than the minimum', async () => {
      const { result, rerender } = await setup(false);
      await act(async () => jest.advanceTimersByTime(8000));
      expect(result.current).toBe(true);
      await rerender({ ready: true });
      expect(result.current).toBe(false);
    });

    it('is dropped at the cap even if the app never becomes ready', async () => {
      const { result } = await setup(false);
      await act(async () => jest.advanceTimersByTime(14999));
      expect(result.current).toBe(true);
      await act(async () => jest.advanceTimersByTime(1));
      expect(result.current).toBe(false);
    });

    it('clears its timers when it unmounts', async () => {
      const { unmount } = await setup(false);
      const clear = jest.spyOn(global, 'clearTimeout');
      await unmount();
      expect(clear).toHaveBeenCalledTimes(2);
      clear.mockRestore();
    });
  });
}

{
  const setPlatform = (os: string) => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
  };
  const originalOS = Platform.OS;

  beforeEach(() => jest.mocked(NavigationBar.setHidden).mockReset());
  afterEach(() => setPlatform(originalOS));

  describe('useImmersiveNavigationBar', () => {
    it('hides the navigation bar on Android, and shows it again when the screen goes away', async () => {
      setPlatform('android');
      const { unmount } = await renderHook(() => useImmersiveNavigationBar());
      expect(NavigationBar.setHidden).toHaveBeenLastCalledWith(true);
      await unmount();
      expect(NavigationBar.setHidden).toHaveBeenLastCalledWith(false);
      expect(NavigationBar.setHidden).toHaveBeenCalledTimes(2);
    });

    it('does nothing elsewhere than Android', async () => {
      setPlatform('ios');
      const { unmount } = await renderHook(() => useImmersiveNavigationBar());
      await unmount();
      expect(NavigationBar.setHidden).not.toHaveBeenCalled();
    });

    it('swallows a failure: the game plays just the same', async () => {
      setPlatform('android');
      jest.mocked(NavigationBar.setHidden).mockImplementation(() => {
        throw new Error('no native module');
      });
      const { unmount } = await renderHook(() => useImmersiveNavigationBar());
      await expect(unmount()).resolves.not.toThrow();
    });
  });
}
