import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import HomeScreen from '..';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen — content', () => {
  it('shows the title, tagline, and the game card', async () => {
    const { getByText, getAllByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
    expect(getByText('Boussole')).toBeTruthy();
    expect(getAllByText('Jouer')).toHaveLength(1);
  });

  it('puts the card at the bottom of the screen', async () => {
    const { getByText } = await render(<HomeScreen />);
    // En remontant depuis la 1re carte, la pile de cartes est le 1er conteneur pousse en fin.
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
});

describe('HomeScreen — mascot settings button', () => {
  it('opens the settings', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
