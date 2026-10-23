import { fireEvent, render } from '@testing-library/react-native';

import { ThemeSettingsContext } from '@/themes';

import GameHeader from '..';

const baseProps = {
  onQuit: jest.fn(),
  code: 'tabofuna',
  name: 'Zoé',
  points: 1250,
  roundNumber: 2,
  totalRounds: 5,
  difficulty: 'easy' as const,
};

beforeEach(() => jest.clearAllMocks());

describe('GameHeader', () => {
  it('shows the upper-cased room code, this device name with its points, and the round', async () => {
    const { getByText } = await render(<GameHeader {...baseProps} />);
    expect(getByText('TABOFUNA')).toBeTruthy();
    expect(getByText(/Zoé · .*1.*250.* pts/)).toBeTruthy();
    expect(getByText(/Manche/)).toBeTruthy();
  });

  it('quits through the cross button', async () => {
    const { getByRole } = await render(<GameHeader {...baseProps} />);
    await fireEvent.press(getByRole('button'));
    expect(baseProps.onQuit).toHaveBeenCalledTimes(1);
  });

  it('says where the player stands (travel mode) only when given a location', async () => {
    const withLocation = await render(<GameHeader {...baseProps} location="Vous êtes à Cusco" />);
    expect(withLocation.getByText('Vous êtes à Cusco')).toBeTruthy();
    const without = await render(<GameHeader {...baseProps} />);
    expect(without.queryByText(/Vous êtes/)).toBeNull();
  });

  it('has no question unless given', async () => {
    const { queryByText } = await render(<GameHeader {...baseProps} />);
    expect(queryByText('Quel est ce pays ?')).toBeNull();
  });

  it('renders by day too', async () => {
    const { getByText } = await render(
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'day',
          ready: true,
          setThemeId: jest.fn(),
          resetThemeId: jest.fn(),
        }}
      >
        <GameHeader {...baseProps} />
      </ThemeSettingsContext.Provider>,
    );
    expect(getByText('TABOFUNA')).toBeTruthy();
  });
});
