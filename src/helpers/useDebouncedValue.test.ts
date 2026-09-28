import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './useDebouncedValue';

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
