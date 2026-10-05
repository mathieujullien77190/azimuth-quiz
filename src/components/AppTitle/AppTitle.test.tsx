import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import AppTitle, { APP_TITLE } from '.';

describe('AppTitle', () => {
  it('shows the title and its tagline', async () => {
    const { getByText } = await render(<AppTitle tagline="Pas de GPS, que de l’instinct." />);
    expect(getByText(APP_TITLE)).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
  });

  it('lays what the caller gives over the header', async () => {
    const { getByText } = await render(
      <AppTitle tagline="x">
        <Text>mascot</Text>
      </AppTitle>,
    );
    expect(getByText('mascot')).toBeTruthy();
  });
});
