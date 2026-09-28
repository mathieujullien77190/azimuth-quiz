import { fireEvent, render } from '@testing-library/react-native';

import FinalStandings from '.';
import type { RoundsRecap } from './types';

const baseProps = { homeLabel: 'Accueil', onHome: jest.fn(), title: 'Classement final' };

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

  it('shows no banner for a single player, and calls onHome', async () => {
    const onHome = jest.fn();
    const { queryByText, getByText } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 250 }]} onHome={onHome} />,
    );
    expect(queryByText(/gagne|Égalité/)).toBeNull();
    await fireEvent.press(getByText('Accueil'));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('shows a dot in the player color when there is one', async () => {
    const { toJSON } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 250, color: '#EF4444' }]} />,
    );
    expect(JSON.stringify(toJSON())).toContain('#EF4444');
  });
});

describe('FinalStandings — the rank card', () => {
  const hero = { emoji: '🧭', title: 'Navigateur' };

  it('replaces the list with the title and the big score when playing alone', async () => {
    const { getByText, queryByText } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 900 }]} hero={hero} />,
    );
    expect(getByText('🧭')).toBeTruthy();
    expect(getByText('Navigateur')).toBeTruthy();
    expect(getByText(/900/)).toBeTruthy();
    expect(queryByText('Zoé')).toBeNull();
    expect(queryByText(/pts/)).toBeNull();
  });

  it('keeps the list beside the card with several players, without the banner', async () => {
    const { getByText, queryByText } = await render(
      <FinalStandings
        {...baseProps}
        entries={[
          { name: 'Zoé', total: 900 },
          { name: 'Max', total: 100 },
        ]}
        hero={hero}
      />,
    );
    expect(getByText('Zoé')).toBeTruthy();
    expect(queryByText(/gagne/)).toBeNull();
  });
});

describe('FinalStandings — the rounds recap', () => {
  const recap: RoundsRecap = {
    title: 'Manche par manche',
    columns: ['Direction', 'Distance'],
    rows: [
      {
        label: 'Paris',
        cells: [{ text: 'Zoé', detail: '+400', color: '#EF4444' }, { text: '–' }],
      },
    ],
  };

  it('is absent unless given', async () => {
    const { queryByText } = await render(<FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 1 }]} />);
    expect(queryByText('Manche par manche')).toBeNull();
  });

  it('lays out one row per round, one cell per column, with the detail and the dot', async () => {
    const { getByText, getAllByText, toJSON } = await render(
      <FinalStandings {...baseProps} entries={[{ name: 'Zoé', total: 1 }]} recap={recap} />,
    );
    expect(getByText('Manche par manche')).toBeTruthy();
    expect(getByText('Direction')).toBeTruthy();
    expect(getByText('Distance')).toBeTruthy();
    expect(getByText('Paris')).toBeTruthy();
    expect(getAllByText('Zoé')).toHaveLength(2); // the ranking, and the recap's cell
    expect(getByText('+400')).toBeTruthy();
    expect(getByText('–')).toBeTruthy();
    expect(JSON.stringify(toJSON())).toContain('#EF4444');
  });
});
