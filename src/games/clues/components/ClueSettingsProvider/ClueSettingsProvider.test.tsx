import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DEFAULT_CLUE_SETTINGS } from '@/games/clues/constants';
import { useClueSettings } from '@/settings';

import ClueSettingsProvider from '.';

const Probe = () => {
  const { settings, updateSettings } = useClueSettings();
  return (
    <>
      <Text testID="rounds">{settings.rounds}</Text>
      <Text testID="difficulty">{settings.difficulty}</Text>
      <Text testID="bump" onPress={() => updateSettings({ difficulty: 'hard' })}>
        bump
      </Text>
    </>
  );
};

describe('ClueSettingsProvider', () => {
  it('provides the default settings to consumers', async () => {
    const { getByTestId } = await render(
      <ClueSettingsProvider>
        <Probe />
      </ClueSettingsProvider>,
    );
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_CLUE_SETTINGS.rounds);
    expect(getByTestId('difficulty').props.children).toBe(DEFAULT_CLUE_SETTINGS.difficulty);
  });

  it('merges a partial patch into the current settings via updateSettings', async () => {
    const { getByTestId } = await render(
      <ClueSettingsProvider>
        <Probe />
      </ClueSettingsProvider>,
    );
    await fireEvent.press(getByTestId('bump'));
    expect(getByTestId('difficulty').props.children).toBe('hard');
    // The rest of the settings are preserved (partial merge, not a replacement).
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_CLUE_SETTINGS.rounds);
  });
});
