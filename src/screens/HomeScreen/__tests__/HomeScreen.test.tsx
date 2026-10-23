import { act, fireEvent, render } from '@testing-library/react-native';

import { useStartup } from '@/store/startupStore';

import HomeScreen from '..';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  useStartup.setState({ loading: false });
});
afterEach(() => jest.useRealTimers());

describe('HomeScreen — contenu', () => {
  it('montre le titre et la baseline', async () => {
    const { getByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
  });

  it('montre les boutons une fois le chargement termine', async () => {
    const { getByText, queryByText } = await render(<HomeScreen />);
    expect(getByText('Jouer')).toBeTruthy();
    expect(getByText('Rejoindre')).toBeTruthy();
    expect(queryByText('Chargement…')).toBeNull();
  });
});

describe('HomeScreen — demarrage', () => {
  it('montre la barre de chargement a la place des boutons tant que l\'app charge', async () => {
    useStartup.setState({ loading: true });
    const { getByText, queryByText } = await render(<HomeScreen />);
    expect(getByText('Chargement…')).toBeTruthy();
    expect(queryByText('Jouer')).toBeNull();
    expect(queryByText('Rejoindre')).toBeNull();
  });

  it('laisse la place aux boutons quand le chargement se termine', async () => {
    useStartup.setState({ loading: true });
    const { getByText, queryByText } = await render(<HomeScreen />);
    await act(async () => useStartup.setState({ loading: false }));
    await act(async () => jest.advanceTimersByTime(400));
    expect(getByText('Jouer')).toBeTruthy();
    expect(queryByText('Chargement…')).toBeNull();
  });

  it('garde le bouton reglages en haut pendant le chargement', async () => {
    useStartup.setState({ loading: true });
    const { getByLabelText } = await render(<HomeScreen />);
    expect(getByLabelText('Réglages')).toBeTruthy();
  });
});

describe('HomeScreen — navigation', () => {
  it('ouvre la preparation avec « Jouer »', async () => {
    const { getByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Jouer'));
    expect(mockPush).toHaveBeenCalledWith('/setup');
  });

  it('ouvre la preparation en mode rejoindre avec « Rejoindre »', async () => {
    const { getByText } = await render(<HomeScreen />);
    await fireEvent.press(getByText('Rejoindre'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/setup', params: { join: '1' } });
  });

  it('ouvre les reglages avec la mascotte', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
