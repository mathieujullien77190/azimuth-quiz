import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import Screen from '.';

describe('Screen', () => {
  it('renders children, and header/footer when given', async () => {
    const { getByText } = await render(
      <Screen footer={<Text>Footer</Text>} header={<Text>Header</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });

  it('renders no footer wrapper when none is given', async () => {
    const { queryByText } = await render(
      <Screen>
        <Text>Body</Text>
      </Screen>,
    );
    expect(queryByText('Footer')).toBeNull();
  });
});
