import { act, render } from '@testing-library/react-native';

import { SPLASH_MAX_MS, SPLASH_MIN_MS } from '@/data';
import { translations } from '@/i18n/translations';

import { versionLabel } from '@/helpers/version';
import { SPLASH_CODENAME, SPLASH_VERSION_NUMBER } from './constants';
import StartupSplash from '.';


type Ready = { theme: boolean; language: boolean; settings: boolean; name: boolean; devCode: boolean };
let mockReady: Ready;
let mockThemeId: 'night' | 'day';

jest.mock('@/themes', () => {
  const actual = jest.requireActual('@/themes');
  return {
    ...actual,
    useThemeSettings: () => ({ themeId: mockThemeId, ready: mockReady.theme }),
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
  useDevCode: (select: (state: { ready: boolean }) => boolean) => select({ ready: mockReady.devCode }),
}));

const allReady: Ready = { theme: true, language: true, settings: true, name: true, devCode: true };

beforeEach(() => {
  jest.useFakeTimers();
  mockReady = { ...allReady };
  mockThemeId = 'night';
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('StartupSplash', () => {
  it('shows the splash with its one-liner, the loading label and the version line', async () => {
    const { getByText } = await render(<StartupSplash />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
    expect(getByText(translations.fr.app.tagline)).toBeTruthy();
    expect(getByText(translations.fr.splash.loading)).toBeTruthy();
    expect(getByText(versionLabel(SPLASH_VERSION_NUMBER, SPLASH_CODENAME))).toBeTruthy();
  });

  it('stays the minimum time even though everything is ready, then fades away', async () => {
    const { queryByText } = await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS - 1));
    expect(queryByText('AZIMUTH QUIZ')).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(1));
    await act(async () => jest.advanceTimersByTime(400));
    expect(queryByText('AZIMUTH QUIZ')).toBeNull();
  });

  it('waits for what is still loading, even past the minimum time', async () => {
    mockReady = { ...allReady, settings: false };
    const { queryByText, rerender } = await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MIN_MS + 2000));
    expect(queryByText('AZIMUTH QUIZ')).toBeTruthy();
    mockReady = { ...allReady };
    await rerender(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(400));
    await act(async () => jest.advanceTimersByTime(400));
    expect(queryByText('AZIMUTH QUIZ')).toBeNull();
  });

  it('only paints the boot colour while the saved theme is unknown, so the wrong theme never flashes', async () => {
    mockReady = { ...allReady, theme: false };
    const { queryByText, getByTestId } = await render(<StartupSplash />);
    expect(getByTestId('boot-splash')).toBeTruthy();
    expect(queryByText('AZIMUTH QUIZ')).toBeNull();
  });

  it('is dropped at the cap if the theme is never read', async () => {
    mockReady = { ...allReady, theme: false };
    const { queryByTestId } = await render(<StartupSplash />);
    await act(async () => jest.advanceTimersByTime(SPLASH_MAX_MS));
    expect(queryByTestId('boot-splash')).toBeNull();
  });

  it('shows the splash when the saved theme is day too', async () => {
    mockThemeId = 'day';
    const { getByText } = await render(<StartupSplash />);
    expect(getByText('AZIMUTH QUIZ')).toBeTruthy();
  });

  it('has its one-liner in both languages', () => {
    expect(translations.fr.app.tagline).toBe('Pas de GPS, que de l’instinct.');
    expect(translations.en.app.tagline).toBe('No GPS, just instinct.');
  });
});
