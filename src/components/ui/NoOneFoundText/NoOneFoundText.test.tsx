import { render } from '@testing-library/react-native';

import NoOneFoundText from '.';

describe('NoOneFoundText', () => {
  it('names the one player in solo play', async () => {
    const { getByText } = await render(<NoOneFoundText players={['Zoé']} />);
    expect(getByText('Zoé n’a pas trouvé — 0 point.')).toBeTruthy();
  });

  it('uses the generic "nobody" wording in multiplayer', async () => {
    const { getByText } = await render(<NoOneFoundText players={['Zoé', 'Max']} />);
    expect(getByText('Personne n’a trouvé — 0 point.')).toBeTruthy();
  });
});
