import { NavigationBar } from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import { useImmersiveNavigationBar } from './useImmersiveNavigationBar';

jest.mock('expo-navigation-bar', () => ({ NavigationBar: { setHidden: jest.fn() } }));

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
