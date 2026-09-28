import { act, renderHook } from '@testing-library/react-native';

import { useTransientFlag } from './useTransientFlag';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useTransientFlag', () => {
  it('starts down', async () => {
    const { result } = await renderHook(() => useTransientFlag());
    expect(result.current.visible).toBe(false);
  });

  it('switches itself off after 2s by default', async () => {
    const { result } = await renderHook(() => useTransientFlag());
    await act(async () => result.current.show());
    expect(result.current.visible).toBe(true);
    await act(async () => jest.advanceTimersByTime(1999));
    expect(result.current.visible).toBe(true);
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current.visible).toBe(false);
  });

  it('honors a custom duration', async () => {
    const { result } = await renderHook(() => useTransientFlag(500));
    await act(async () => result.current.show());
    await act(async () => jest.advanceTimersByTime(500));
    expect(result.current.visible).toBe(false);
  });

  it('can be dropped early, and its timer is then cancelled', async () => {
    const { result } = await renderHook(() => useTransientFlag());
    await act(async () => result.current.show());
    await act(async () => result.current.hide());
    expect(result.current.visible).toBe(false);
    await act(async () => result.current.show());
    await act(async () => jest.advanceTimersByTime(1000));
    expect(result.current.visible).toBe(true);
  });

  it('keeps stable show/hide callbacks across renders', async () => {
    const { result, rerender } = await renderHook(() => useTransientFlag());
    const { show, hide } = result.current;
    await rerender({});
    expect(result.current.show).toBe(show);
    expect(result.current.hide).toBe(hide);
  });
});
