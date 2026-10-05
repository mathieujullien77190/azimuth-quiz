import { fireEvent, render } from '@testing-library/react-native';

import { ThemeSettingsContext } from '@/themes';

import GameHeader from '.';

const baseProps = {
  onQuit: jest.fn(),
  code: 'tabofuna',
  name: 'Zoé',
  points: 1250,
  roundNumber: 2,
  totalRounds: 5,
  difficulty: 'easy' as const,
};

const players = [
  { name: 'Zoé', color: '#EF4444' },
  { name: 'Max', color: '#16A34A' },
];

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

  it('has no player tabs nor question unless given', async () => {
    const { queryByText } = await render(<GameHeader {...baseProps} />);
    expect(queryByText('MA')).toBeNull();
    expect(queryByText('Quel est ce pays ?')).toBeNull();
  });

  it('shows the player tabs, with the active player announced by name', async () => {
    const { getByText } = await render(<GameHeader {...baseProps} players={players} turnIndex={1} />);
    expect(getByText('À Max de jouer')).toBeTruthy();
    expect(getByText('ZO')).toBeTruthy();
  });

  it('announces nobody by default (nobody has the turn)', async () => {
    const { getByText, queryByText } = await render(<GameHeader {...baseProps} players={players} />);
    expect(getByText('ZO')).toBeTruthy();
    expect(queryByText(/de jouer/)).toBeNull();
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

  it('shows the round question', async () => {
    const { getByText } = await render(<GameHeader {...baseProps} question="Quel est ce pays ?" />);
    expect(getByText('Quel est ce pays ?')).toBeTruthy();
  });

  it('shows the detail on the right of the question row, and only with a question', async () => {
    const withQuestion = await render(
      <GameHeader {...baseProps} question="Quel est ce pays ?" questionDetail="182 pts" />,
    );
    expect(withQuestion.getByText('182 pts')).toBeTruthy();
    expect(withQuestion.getByText('Quel est ce pays ?')).toBeTruthy();
    const withoutQuestion = await render(<GameHeader {...baseProps} questionDetail="182 pts" />);
    expect(withoutQuestion.queryByText('182 pts')).toBeNull();
  });
});
