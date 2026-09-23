import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import Card from '.';

describe('Card', () => {
  it('renders children', async () => {
    const { getByText } = await render(
      <Card>
        <Text>content</Text>
      </Card>,
    );
    expect(getByText('content')).toBeTruthy();
  });

  it('merges a custom style with the base card style', async () => {
    const { toJSON } = await render(
      <Card style={{ marginTop: 12 }}>
        <Text>content</Text>
      </Card>,
    );
    expect(toJSON()).toBeTruthy();
  });
});
