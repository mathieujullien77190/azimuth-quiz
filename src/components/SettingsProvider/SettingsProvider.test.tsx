import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DEFAULT_SETTINGS } from '@/constants';
import { loadSettings, saveSettings } from '@/helpers';
import { useSettings } from '@/settings';

import SettingsProvider from '.';

jest.mock('@/helpers', () => ({
  ...jest.requireActual('@/helpers'),
  loadSettings: jest.fn(),
  saveSettings: jest.fn(),
}));

const mockedLoadSettings = loadSettings as jest.Mock;
const mockedSaveSettings = saveSettings as jest.Mock;

const Probe = () => {
  const { settings, ready, updateSettings, resetSettings } = useSettings();
  return (
    <>
      <Text testID="ready">{String(ready)}</Text>
      <Text testID="rounds">{settings.rounds}</Text>
      <Text testID="useGps">{String(settings.useGps)}</Text>
      <Text testID="bump" onPress={() => updateSettings({ useGps: false })}>
        bump
      </Text>
      <Text testID="reset" onPress={() => resetSettings()}>
        reset
      </Text>
    </>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoadSettings.mockResolvedValue(DEFAULT_SETTINGS);
});

describe('SettingsProvider', () => {
  it('starts not ready with default settings, becomes ready once storage is read', async () => {
    const { getByTestId } = await render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_SETTINGS.rounds);
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
  });

  it('exposes the settings loaded from storage once ready', async () => {
    mockedLoadSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, rounds: 15 });
    const { getByTestId } = await render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(getByTestId('rounds').props.children).toBe(15));
  });

  it('updateSettings merges a partial patch and persists it', async () => {
    const { getByTestId } = await render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(getByTestId('ready').props.children).toBe('true'));
    await fireEvent.press(getByTestId('bump'));
    expect(getByTestId('useGps').props.children).toBe('false');
    // The rest of the settings is preserved (a partial merge, not a replacement).
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_SETTINGS.rounds);
    expect(mockedSaveSettings).toHaveBeenCalledWith(expect.objectContaining({ useGps: false }));
  });

  it('resetSettings restores the defaults in memory, without touching storage', async () => {
    mockedLoadSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, rounds: 15 });
    const { getByTestId } = await render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await waitFor(() => expect(getByTestId('rounds').props.children).toBe(15));
    await fireEvent.press(getByTestId('reset'));
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_SETTINGS.rounds);
    expect(mockedSaveSettings).not.toHaveBeenCalled();
  });

  it('does not update state after unmount if loadSettings settles late', async () => {
    let resolveLoad!: (value: typeof DEFAULT_SETTINGS) => void;
    mockedLoadSettings.mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)));
    const { unmount } = await render(
      <SettingsProvider>
        <Probe />
      </SettingsProvider>,
    );
    await unmount();
    resolveLoad(DEFAULT_SETTINGS);
    // Flushes the resolved promise's `.then()` (and its `cancelled` guard) before finishing.
    await act(async () => {
      await Promise.resolve();
    });
  });
});
