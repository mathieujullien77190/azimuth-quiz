import { act, fireEvent, render } from '@testing-library/react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';

import HomeScreen from '..';

type Ready = { theme: boolean; language: boolean; settings: boolean; name: boolean };
let mockReady: Ready;

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return { ...actual, useThemeSettings: () => ({ themeId: 'night', ready: mockReady.theme }) };
});
jest.mock('@/i18n', () => {
  const actual = jest.requireActual('@/i18n');
  return { ...actual, useLanguage: () => ({ language: 'fr', ready: mockReady.language }) };
});
jest.mock('@/settings', () => ({
  useSettings: (select: (state: { ready: boolean }) => boolean) => select({ ready: mockReady.settings }),
  usePlayerName: (select: (state: { ready: boolean }) => boolean) => select({ ready: mockReady.name }),
}));

const allReady: Ready = { theme: true, language: true, settings: true, name: true };

/** Laisse passer le temps minimum de chargement : l'accueil montre alors ses boutons. */
const finishLoading = () => act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockReady = { ...allReady };
});
afterEach(() => jest.useRealTimers());

describe('HomeScreen — contenu', () => {
  it('montre le titre et la baseline', async () => {
    const { getByText } = await render(<HomeScreen />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText('Pas de GPS, que de l’instinct.')).toBeTruthy();
  });
});

describe('HomeScreen — demarrage', () => {
  it('montre la barre de chargement a la place des boutons tant que l’app charge', async () => {
    const { getByText, queryByText } = await render(<HomeScreen />);
    expect(getByText('Chargement…')).toBeTruthy();
    expect(queryByText('Jouer')).toBeNull();
    expect(queryByText('Rejoindre')).toBeNull();
  });

  it('remplace la barre par les boutons des que le temps minimum est passe', async () => {
    const { getByText, queryByText } = await render(<HomeScreen />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS - 1));
    expect(queryByText('Jouer')).toBeNull();
    await act(async () => jest.advanceTimersByTime(1));
    expect(getByText('Jouer')).toBeTruthy();
    expect(getByText('Rejoindre')).toBeTruthy();
    expect(queryByText('Chargement…')).toBeNull();
  });

  it('attend ce qui charge encore, meme apres le temps minimum', async () => {
    mockReady = { ...allReady, settings: false };
    const { queryByText, getByText, rerender } = await render(<HomeScreen />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS + 2000));
    expect(getByText('Chargement…')).toBeTruthy();
    expect(queryByText('Jouer')).toBeNull();
    mockReady = { ...allReady };
    await rerender(<HomeScreen />);
    expect(getByText('Jouer')).toBeTruthy();
  });

  it('ne peint que la couleur de demarrage tant que le theme sauvegarde est inconnu', async () => {
    mockReady = { ...allReady, theme: false };
    const { getByTestId, queryByText } = await render(<HomeScreen />);
    expect(getByTestId('boot-splash')).toBeTruthy();
    expect(queryByText('AZIMUTH QUIZ')).toBeNull();
  });

  it('montre l’accueil au plafond meme si le theme n’est jamais lu', async () => {
    mockReady = { ...allReady, theme: false };
    const { queryByTestId, getByText } = await render(<HomeScreen />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MAX_MS));
    expect(queryByTestId('boot-splash')).toBeNull();
    expect(getByText('Jouer')).toBeTruthy();
  });

  it('garde le bouton reglages en haut pendant le chargement', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    expect(getByLabelText('Réglages')).toBeTruthy();
  });
});

describe('HomeScreen — navigation', () => {
  it('ouvre la preparation avec « Jouer »', async () => {
    const { getByText } = await render(<HomeScreen />);
    await finishLoading();
    await fireEvent.press(getByText('Jouer'));
    expect(mockPush).toHaveBeenCalledWith('/setup');
  });

  it('ouvre la preparation en mode rejoindre avec « Rejoindre »', async () => {
    const { getByText } = await render(<HomeScreen />);
    await finishLoading();
    await fireEvent.press(getByText('Rejoindre'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/setup', params: { join: '1' } });
  });

  it('ouvre les reglages avec la mascotte', async () => {
    const { getByLabelText } = await render(<HomeScreen />);
    await fireEvent.press(getByLabelText('Réglages'));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
