import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { THEME_STORAGE_KEY } from '@/data';
import { useThemeSettings } from '@/themes';

import ThemeProvider from '..';

const Probe = () => {
  const { themeId, ready, setThemeId, resetThemeId } = useThemeSettings();
  return (
    <>
      <Text testID="themeId">{themeId}</Text>
      <Text testID="ready">{String(ready)}</Text>
      <Text onPress={() => setThemeId('day')} testID="setDay">
        setDay
      </Text>
      <Text onPress={resetThemeId} testID="reset">
        reset
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
    // Rien n'est ecrit en stockage par resetThemeId (voir son commentaire).
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe('day');
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
    // Resolu apres le demontage : sans le drapeau `cancelled`, React loggerait un warning de mise a jour apres demontage.
    await act(async () => {
      resolveGetItem('day');
    });
  });
});
