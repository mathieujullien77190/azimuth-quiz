import { fireEvent, render } from '@testing-library/react-native';

import FinalStandings from '.';

describe('FinalStandings', () => {
  it('ranks players best first and announces the winner', async () => {
    const { getByText, getAllByText } = await render(
      <FinalStandings
        entries={[
          { name: 'Zoé', total: 300 },
          { name: 'Max', total: 700 },
        ]}
        homeLabel="Accueil"
        onHome={jest.fn()}
        title="Classement final"
      />,
    );
    expect(getByText('Classement final')).toBeTruthy();
    expect(getByText('Max gagne !')).toBeTruthy();
    expect(getAllByText(/^\d\.$/).map((node) => node.props.children.join(''))).toEqual(['1.', '2.']);
  });

  it('announces a tie', async () => {
    const { getByText } = await render(
      <FinalStandings
        entries={[
          { name: 'Zoé', total: 500 },
          { name: 'Max', total: 500 },
        ]}
        homeLabel="Accueil"
        onHome={jest.fn()}
        title="Classement final"
      />,
    );
    expect(getByText(/Égalité/)).toBeTruthy();
  });

  it('shows no banner for a single player, and calls onHome', async () => {
    const onHome = jest.fn();
    const { queryByText, getByText } = await render(
      <FinalStandings entries={[{ name: 'Zoé', total: 250 }]} homeLabel="Accueil" onHome={onHome} title="Classement final" />,
    );
    expect(queryByText(/gagne|Égalité/)).toBeNull();
    await fireEvent.press(getByText('Accueil'));
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
