import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ANIMATIONS_ENABLED_STORAGE_KEY, THEME_STORAGE_KEY } from '@/constants';
import { useThemeSettings } from '@/themes';

import ThemeProvider from '.';

const Probe = () => {
  const { themeId, ready, setThemeId, resetThemeId, animationsEnabled, setAnimationsEnabled, resetAnimationsEnabled } =
    useThemeSettings();
  return (
    <>
      <Text testID="themeId">{themeId}</Text>
      <Text testID="ready">{String(ready)}</Text>
      <Text testID="animationsEnabled">{String(animationsEnabled)}</Text>
      <Text onPress={() => setThemeId('day')} testID="setDay">
        setDay
      </Text>
      <Text onPress={resetThemeId} testID="reset">
        reset
      </Text>
      <Text onPress={() => setAnimationsEnabled(true)} testID="enableAnimations">
        enableAnimations
      </Text>
      <Text onPress={resetAnimationsEnabled} testID="resetAnimations">
        resetAnimations
      </Text>
    </>
  );
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ThemeProvider', () => {
  it('starts on "night" and becomes ready once nothing is stored', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    expect(getByTestId('themeId').props.children).toBe('night');
  });

  it('loads a previously stored theme', async () => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, 'day');
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('themeId').props.children).toBe('day'));
  });

  it('setThemeId updates the theme and persists it', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('setDay'));
    expect(getByTestId('themeId').props.children).toBe('day');
    await waitFor(async () => expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe('day'));
  });

  it('resetThemeId falls back to "night" without touching storage', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('setDay'));
    expect(getByTestId('themeId').props.children).toBe('day');

    await fireEvent.press(getByTestId('reset'));
    expect(getByTestId('themeId').props.children).toBe('night');
    // Nothing is written to storage by resetThemeId (see the function's doc comment).
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe('day');
  });

  it('loads a previously stored animationsEnabled value', async () => {
    await AsyncStorage.setItem(ANIMATIONS_ENABLED_STORAGE_KEY, 'true');
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('animationsEnabled').props.children).toBe('true'));
  });

  it('setAnimationsEnabled updates the value and persists it', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('enableAnimations'));
    expect(getByTestId('animationsEnabled').props.children).toBe('true');
    await waitFor(async () => expect(await AsyncStorage.getItem(ANIMATIONS_ENABLED_STORAGE_KEY)).toBe('true'));
  });

  it('resetAnimationsEnabled falls back to false without touching storage', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('enableAnimations'));
    expect(getByTestId('animationsEnabled').props.children).toBe('true');

    await fireEvent.press(getByTestId('resetAnimations'));
    expect(getByTestId('animationsEnabled').props.children).toBe('false');
    expect(await AsyncStorage.getItem(ANIMATIONS_ENABLED_STORAGE_KEY)).toBe('true');
  });

  it('does not update state after unmounting while the initial load is still pending', async () => {
    let resolveGetItem: (value: string | null) => void = () => {};
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
      () => new Promise<string | null>((resolve) => (resolveGetItem = resolve)),
    );
    const { unmount } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await unmount();
    // Resolves after unmount: if the `cancelled` flag didn't work, React would log a
    // warning about a state update on an unmounted component.
    await act(async () => {
      resolveGetItem('day');
    });
  });
});
