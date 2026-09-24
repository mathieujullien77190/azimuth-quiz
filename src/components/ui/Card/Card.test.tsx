import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import Card from '.';

let mockCardOverride: { borderWidth: number; shadowColor: string | null; shadowOpacity: number } | undefined;

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return {
    ...actual,
    useThemedStyles: (createStyles: (theme: unknown) => unknown) =>
      createStyles(mockCardOverride ? { ...actual.night, card: mockCardOverride } : actual.night),
  };
});

afterEach(() => {
  mockCardOverride = undefined;
});

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

  it('adds a shadow when the theme defines a shadowColor', async () => {
    mockCardOverride = { borderWidth: 1, shadowColor: '#000000', shadowOpacity: 0.4 };
    const { toJSON } = await render(
      <Card>
        <Text>content</Text>
      </Card>,
    );
    expect(toJSON()).toBeTruthy();
  });
});
