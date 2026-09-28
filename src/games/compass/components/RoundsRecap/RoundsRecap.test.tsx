import { render } from '@testing-library/react-native';

import RoundsRecap from '.';

const props = {
  title: 'Manche par manche',
  columns: ['Direction', 'Distance'],
  rows: [
    {
      label: 'Paris',
      cells: [{ text: 'Zoé', detail: '+400', color: '#EF4444' }, { text: '–' }],
    },
    {
      label: 'Tokyo',
      cells: [{ text: '+300' }, { text: 'Max', detail: '+280' }],
    },
  ],
};

describe('RoundsRecap', () => {
  it('shows its title and one column header per criterion', async () => {
    const { getByText } = await render(<RoundsRecap {...props} />);
    expect(getByText('Manche par manche')).toBeTruthy();
    expect(getByText('Direction')).toBeTruthy();
    expect(getByText('Distance')).toBeTruthy();
  });

  it('lays out one row per round, one cell per column, with the detail under the text', async () => {
    const { getByText } = await render(<RoundsRecap {...props} />);
    expect(getByText('Paris')).toBeTruthy();
    expect(getByText('Tokyo')).toBeTruthy();
    expect(getByText('Zoé')).toBeTruthy();
    expect(getByText('+400')).toBeTruthy();
    expect(getByText('–')).toBeTruthy();
    expect(getByText('+300')).toBeTruthy();
    expect(getByText('Max')).toBeTruthy();
    expect(getByText('+280')).toBeTruthy();
  });

  it('draws a dot in the player color only for a cell that has one', async () => {
    const { toJSON } = await render(<RoundsRecap {...props} />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('#EF4444');
    // Only Zoé's cell has a color: a single dot.
    expect(json.match(/"borderRadius":6/g)).toHaveLength(1);
  });

  it('is empty below its header when there are no rounds', async () => {
    const { getByText, queryByText } = await render(<RoundsRecap {...props} rows={[]} />);
    expect(getByText('Direction')).toBeTruthy();
    expect(queryByText('Paris')).toBeNull();
  });
});
