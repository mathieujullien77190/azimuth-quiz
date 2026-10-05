import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import NoOneFoundText from '.';
import { FOUND_BANNER_FONT_SIZE } from './styles';

describe('NoOneFoundText', () => {
  it('names the one player in solo play', async () => {
    const { getByText } = await render(<NoOneFoundText players={['Zoé']} />);
    expect(getByText('Zoé n’a pas trouvé — 0 point.')).toBeTruthy();
  });

  it('uses the generic "nobody" wording in multiplayer', async () => {
    const { getByText } = await render(<NoOneFoundText players={['Zoé', 'Max']} />);
    expect(getByText('Personne n’a trouvé — 0 point.')).toBeTruthy();
  });

  it('is bigger when asked to, the size of the winner banner of Silhouette', async () => {
    const { getByText } = await render(<NoOneFoundText large players={['Zoé']} />);
    expect(StyleSheet.flatten(getByText('Zoé n’a pas trouvé — 0 point.').props.style).fontSize).toBe(FOUND_BANNER_FONT_SIZE);
  });
});
