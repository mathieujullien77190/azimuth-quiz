import { act, renderHook } from '@testing-library/react-native';

import { useSplashGate } from './useSplashGate';

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
