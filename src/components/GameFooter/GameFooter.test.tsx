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
});
