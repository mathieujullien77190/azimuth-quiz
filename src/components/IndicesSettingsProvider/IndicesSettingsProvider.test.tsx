import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DEFAULT_INDICES_SETTINGS } from '@/constants';
import { useIndicesSettings } from '@/settings';

import IndicesSettingsProvider from '.';

const Probe = () => {
  const { settings, updateSettings } = useIndicesSettings();
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

describe('IndicesSettingsProvider', () => {
  it('provides the default settings to consumers', async () => {
    const { getByTestId } = await render(
      <IndicesSettingsProvider>
        <Probe />
      </IndicesSettingsProvider>,
    );
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_INDICES_SETTINGS.rounds);
    expect(getByTestId('difficulty').props.children).toBe(DEFAULT_INDICES_SETTINGS.difficulty);
  });

  it('merges a partial patch into the current settings via updateSettings', async () => {
    const { getByTestId } = await render(
      <IndicesSettingsProvider>
        <Probe />
      </IndicesSettingsProvider>,
    );
    await fireEvent.press(getByTestId('bump'));
    expect(getByTestId('difficulty').props.children).toBe('hard');
    // Le reste des reglages est preserve (merge partiel, pas un remplacement).
    expect(getByTestId('rounds').props.children).toBe(DEFAULT_INDICES_SETTINGS.rounds);
  });
});
