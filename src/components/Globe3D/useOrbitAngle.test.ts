import { act, renderHook } from '@testing-library/react-native';

import { useOrbitAngle } from './useOrbitAngle';

describe('useOrbitAngle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts at 0 and goes once round in a period', async () => {
    const { result } = await renderHook(() => useOrbitAngle(1000, 100));
    expect(result.current).toBe(0);
    await act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBeCloseTo(Math.PI);
    await act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBeCloseTo(2 * Math.PI);
  });

  it('stops when unmounted', async () => {
    const { result, unmount } = await renderHook(() => useOrbitAngle(1000, 100));
    await unmount();
    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
  });
});
