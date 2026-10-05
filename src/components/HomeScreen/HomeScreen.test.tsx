import { fireEvent, render } from '@testing-library/react-native';

import HomeScreen from '.';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen — content', () => {
  it('shows the title, tagline, and all three game cards', async () => {
    const { getByText, getAllByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
    expect(getByText('Boussole')).toBeTruthy();
    expect(getByText('Indices')).toBeTruthy();
    expect(getByText('Silhouette')).toBeTruthy();
    expect(getAllByText('Jouer')).toHaveLength(3);
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

  it('navigates to /contour-setup when the Contour card is played', async () => {
    const { getAllByText } = await render(<HomeScreen />);
    await fireEvent.press(getAllByText('Jouer')[2]);
    expect(mockPush).toHaveBeenCalledWith('/contour-setup');
  });
});

describe('HomeScreen — mascot settings button', () => {
  it('opens the settings', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
