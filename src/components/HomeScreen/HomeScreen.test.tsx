import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import HomeScreen from '.';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen — content', () => {
  it('shows the title, tagline, and both game cards', async () => {
    const { getByText, getAllByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
    expect(getByText('Boussole')).toBeTruthy();
    expect(getByText('Indices')).toBeTruthy();
    expect(getAllByText('Jouer')).toHaveLength(2);
  });

  it('stacks the two cards at the bottom of the screen', async () => {
    const { getByText } = await render(<HomeScreen />);
    // Going up from the first card, the stack of both cards is the first container pushed to the end.
    let node = getByText('Boussole').parent;
    while (node && StyleSheet.flatten(node.props.style)?.justifyContent !== 'flex-end') node = node.parent;
    expect(node).not.toBeNull();
    expect(StyleSheet.flatten(node!.props.style).justifyContent).toBe('flex-end');
  });

  it('navigates to /setup when the Boussole card is played', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    await fireEvent.press(getAllByText('Jouer')[0]);
    expect(mockPush).toHaveBeenCalledWith('/setup');
  });

  it('navigates to /clues-setup when the Indices card is played', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    await fireEvent.press(getAllByText('Jouer')[1]);
    expect(mockPush).toHaveBeenCalledWith('/clues-setup');
  });
});

describe('HomeScreen — mascot settings button', () => {
  it('opens the settings', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
