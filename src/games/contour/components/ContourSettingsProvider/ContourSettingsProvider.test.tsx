import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DEFAULT_CONTOUR_SETTINGS } from '@/constants';
import { useContourSettings } from '@/settings';

import ContourSettingsProvider from '.';

const Probe = () => {
  const { settings, updateSettings } = useContourSettings();
  return (
    <>
      <Text testID="rounds">{settings.rounds}</Text>
      <Text testID="players">{settings.playerNames.length}</Text>
      <Text testID="bump" onPress={() => updateSettings({ rounds: 10 })}>
        bump
      </Text>
    </>
  );
};

describe('ContourSettingsProvider', () => {
  it('provides the default settings to consumers', async () => {
    const { getByTestId } = await render(
      <ContourSettingsProvider>
        <Probe />
      </ContourSettingsProvider>,
    );
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_CONTOUR_SETTINGS.rounds);
    expect(getByTestId('players').props.children).toBe(DEFAULT_CONTOUR_SETTINGS.playerNames.length);
  });

  it('merges a partial patch into the current settings via updateSettings', async () => {
    const { getByTestId } = await render(
      <ContourSettingsProvider>
        <Probe />
      </ContourSettingsProvider>,
    );
    await fireEvent.press(getByTestId('bump'));
    expect(getByTestId('rounds').props.children).toBe(10);
    expect(getByTestId('players').props.children).toBe(DEFAULT_CONTOUR_SETTINGS.playerNames.length);
  });
});
