import { render } from '@testing-library/react-native';

import MascotButton from '.';

let mockIsDark = true;

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return { ...actual, useTheme: () => ({ isDark: mockIsDark }) };
});
jest.mock('../UfoButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ accessibilityLabel }: { accessibilityLabel: string }) => <Text>ufo:{accessibilityLabel}</Text>,
  };
});
jest.mock('../HelicopterButton', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ accessibilityLabel }: { accessibilityLabel: string }) => (
      <Text>helicopter:{accessibilityLabel}</Text>
    ),
  };
});

afterEach(() => {
  mockIsDark = true;
});

describe('MascotButton', () => {
  it('renders the UFO by night', async () => {
    mockIsDark = true;
    const { getByText } = await render(<MascotButton accessibilityLabel="Reglages" onPress={jest.fn()} />);
    expect(getByText('ufo:Reglages')).toBeTruthy();
  });

  it('renders the helicopter by day', async () => {
    mockIsDark = false;
    const { getByText } = await render(<MascotButton accessibilityLabel="Reglages" onPress={jest.fn()} />);
    expect(getByText('helicopter:Reglages')).toBeTruthy();
  });
});
