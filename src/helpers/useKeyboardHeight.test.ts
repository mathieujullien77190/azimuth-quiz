import { act, renderHook } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { useKeyboardHeight } from './useKeyboardHeight';

type Listener = (event: { endCoordinates: { height: number } }) => void;

const listeners = new Map<string, Listener>();
const remove = jest.fn();

beforeEach(() => {
  listeners.clear();
  remove.mockClear();
  jest.spyOn(Keyboard, 'addListener').mockImplementation(((name: string, listener: Listener) => {
    listeners.set(name, listener);
    return { remove };
  }) as never);
});
afterEach(() => jest.restoreAllMocks());

describe('useKeyboardHeight', () => {
  it('follows the keyboard: its height while it is up, 0 once it is down', async () => {
    const { result } = await renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);
    await act(async () => listeners.get('keyboardDidShow')?.({ endCoordinates: { height: 300 } }));
    expect(result.current).toBe(300);
    await act(async () => listeners.get('keyboardDidHide')?.({ endCoordinates: { height: 0 } }));
    expect(result.current).toBe(0);
  });

  it('stops listening when the screen goes away', async () => {
    const { unmount } = await renderHook(() => useKeyboardHeight());
    await unmount();
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
