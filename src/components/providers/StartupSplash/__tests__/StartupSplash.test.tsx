import { act, render } from '@testing-library/react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { useStartup } from '@/store/startupStore';

import StartupSplash from '..';

type Ready = { theme: boolean; language: boolean; settings: boolean; name: boolean };
let mockReady: Ready;

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return {
    ...actual,
    useThemeSettings: () => ({ themeId: 'night', ready: mockReady.theme }),
  };
});
jest.mock('@/i18n', () => {
  const actual = jest.requireActual('@/i18n');
  return {
    ...actual,
    useLanguage: () => ({ language: 'fr', ready: mockReady.language }),
  };
});
jest.mock('@/settings', () => ({
  useSettings: (select: (state: { ready: boolean }) => boolean) => select({ ready: mockReady.settings }),
  usePlayerName: (select: (state: { ready: boolean }) => boolean) => select({ ready: mockReady.name }),
}));

const allReady: Ready = { theme: true, language: true, settings: true, name: true };

beforeEach(() => {
  jest.useFakeTimers();
  mockReady = { ...allReady };
  useStartup.setState({ loading: true });
});
afterEach(() => jest.useRealTimers());

describe('StartupSplash', () => {
  it('garde le chargement le temps minimum meme si tout est pret, puis le termine', async () => {
    await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS - 1));
    expect(useStartup.getState().loading).toBe(true);
    await act(async () => jest.advanceTimersByTime(1));
    expect(useStartup.getState().loading).toBe(false);
  });

  it('attend ce qui charge encore, meme apres le temps minimum', async () => {
    mockReady = { ...allReady, settings: false };
    const { rerender } = await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS + 2000));
    expect(useStartup.getState().loading).toBe(true);
    mockReady = { ...allReady };
    await rerender(<StartupSplash />);
    expect(useStartup.getState().loading).toBe(false);
  });

  it('ne peint que la couleur de demarrage tant que le theme sauvegarde est inconnu', async () => {
    mockReady = { ...allReady, theme: false };
    const { getByTestId } = await render(<StartupSplash />);
    expect(getByTestId('boot-splash')).toBeTruthy();
  });

  it('ne peint rien une fois le theme connu', async () => {
    const { queryByTestId } = await render(<StartupSplash />);
    expect(queryByTestId('boot-splash')).toBeNull();
  });

  it("lache le chargement au plafond meme si le theme n'est jamais lu", async () => {
    mockReady = { ...allReady, theme: false };
    const { queryByTestId } = await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MAX_MS));
    expect(queryByTestId('boot-splash')).toBeNull();
    expect(useStartup.getState().loading).toBe(false);
  });
});
