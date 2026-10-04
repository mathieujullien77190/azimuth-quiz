import { fireEvent, render } from '@testing-library/react-native';

import Button from '@/components/ui/Button';
import { ThemeSettingsContext } from '@/themes';

import GameFooter from '.';

const inDay = (children: React.ReactNode) => (
  <ThemeSettingsContext.Provider
    value={{
      themeId: 'day',
      ready: true,
      setThemeId: jest.fn(),
      resetThemeId: jest.fn(),
    }}
  >
    {children}
  </ThemeSettingsContext.Provider>
);

describe('GameFooter', () => {
  it('renders its children', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <GameFooter>
        <Button label="Manche suivante" onPress={onPress} />
      </GameFooter>,
    );
    await fireEvent.press(getByText('Manche suivante'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders its children by day too', async () => {
    const { getByText } = await render(
      inDay(
        <GameFooter>
          <Button label="Manche suivante" onPress={jest.fn()} />
        </GameFooter>,
      ),
    );
    expect(getByText('Manche suivante')).toBeTruthy();
  });

  it('shows the round reactions button above its children, each emoji calling back, when asked', async () => {
    const onReact = jest.fn();
    const { getByLabelText, getByText } = await render(
      <GameFooter onReact={onReact}>
        <Button label="Manche suivante" onPress={jest.fn()} />
      </GameFooter>,
    );
    expect(getByText('Manche suivante')).toBeTruthy();
    await fireEvent.press(getByLabelText('Réactions'));
    await fireEvent.press(getByLabelText('Envoyer 🤞'));
    expect(onReact).toHaveBeenCalledWith('🤞');
  });

  it('has no emojis row without a callback (alone in the room)', async () => {
    const { queryByLabelText } = await render(<GameFooter>{null}</GameFooter>);
    expect(queryByLabelText('Réactions')).toBeNull();
  });
});
