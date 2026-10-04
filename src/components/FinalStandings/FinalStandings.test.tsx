import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import FinalStandings from '.';

const baseProps = { title: 'Classement final', onReplay: jest.fn(), onQuit: jest.fn() };

beforeEach(() => jest.clearAllMocks());

describe('FinalStandings — the scores', () => {
  it('ranks players best first, announces the winner and gives medals to the podium', async () => {
    const { getByText, getAllByText } = await render(
      <FinalStandings
        {...baseProps}
        entries={[
          { name: 'Zoé', total: 300 },
          { name: 'Max', total: 700 },
          { name: 'Léa', total: 100 },
          { name: 'Eve', total: 50 },
        ]}
      />,
    );
    expect(getByText('Classement final')).toBeTruthy();
    expect(getByText('Max gagne !')).toBeTruthy();
    expect(getAllByText(/^(🥇|🥈|🥉)$/).map((node) => node.props.children)).toEqual(['🥇', '🥈', '🥉']);
    // Fourth place has no medal, its number.
    expect(getByText('4.')).toBeTruthy();
  });

  it('gives tied players the same rank, and announces the tie', async () => {
    const { getByText, getAllByText } = await render(
      <FinalStandings
        {...baseProps}
        entries={[
          { name: 'Zoé', total: 500 },
          { name: 'Max', total: 500 },
        ]}
      />,
    );
    expect(getByText(/Égalité/)).toBeTruthy();
    expect(getAllByText('🥇')).toHaveLength(2);
  });

  it('shows no banner for a single player', async () => {
    const { queryByText, getByText } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 250 }]} />,
    );
    expect(queryByText(/gagne|Égalité/)).toBeNull();
    expect(getByText('Zoé')).toBeTruthy();
  });

  it('shows a dot in the player color when there is one', async () => {
    const { toJSON } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 250, color: '#EF4444' }]} />,
    );
    expect(JSON.stringify(toJSON())).toContain('#EF4444');
  });
});

describe('FinalStandings — what the game adds', () => {
  it('shows its children under the scores', async () => {
    const { getByText } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 1 }]}>
        <Text>Récapitulatif</Text>
      </FinalStandings>,
    );
    expect(getByText('Récapitulatif')).toBeTruthy();
  });

  it('shows nothing more without children', async () => {
    const { queryByText } = await render(<FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 1 }]} />);
    expect(queryByText('Récapitulatif')).toBeNull();
  });
});

describe('FinalStandings — the buttons', () => {
  it('plays again or leaves', async () => {
    const onReplay = jest.fn();
    const onQuit = jest.fn();
    const { getByText } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 1 }]} onQuit={onQuit} onReplay={onReplay} />,
    );
    await fireEvent.press(getByText('Rejouer'));
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
    await fireEvent.press(getByText('Quitter'));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});
