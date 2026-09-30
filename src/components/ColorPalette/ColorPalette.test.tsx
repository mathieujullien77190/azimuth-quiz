import { render } from '@testing-library/react-native';

import { LanguageContext } from '@/i18n';
import { THEMES, ThemeSettingsContext } from '@/themes';

import ColorPalette from '.';
import { COLOR_TOKENS } from './constants';

const inEnglish = (children: React.ReactNode) => (
  <LanguageContext.Provider value={{ language: 'en', ready: true, setLanguage: jest.fn(), resetLanguage: jest.fn() }}>
    {children}
  </LanguageContext.Provider>
);

const inDay = (children: React.ReactNode) => (
  <ThemeSettingsContext.Provider
    value={{
      themeId: 'day',
      ready: true,
      setThemeId: jest.fn(),
      resetThemeId: jest.fn(),
    }}
  >
    {children}
  </ThemeSettingsContext.Provider>
);

describe('ColorPalette', () => {
  it('lists every token with what it is for', async () => {
    const { getByText } = await render(<ColorPalette />);
    for (const token of COLOR_TOKENS) {
      expect(getByText(token.name)).toBeTruthy();
      expect(getByText(token.description.fr)).toBeTruthy();
    }
  });

  it("shows each theme's hex value in its own column", async () => {
    const { getAllByText } = await render(<ColorPalette />);
    expect(getAllByText(THEMES.night.colors.background).length).toBeGreaterThan(0);
    expect(getAllByText(THEMES.day.colors.background).length).toBeGreaterThan(0);
  });

  it('marks the theme currently shown', async () => {
    const { getByText, queryByText } = await render(<ColorPalette />);
    expect(getByText('Nuit · thème actuel')).toBeTruthy();
    expect(queryByText(/Jour ·/)).toBeNull();
    expect(getByText('Jour')).toBeTruthy();
  });

  it('marks the day theme when the app is in day mode', async () => {
    const { getByText } = await render(inDay(<ColorPalette />));
    expect(getByText('Jour · thème actuel')).toBeTruthy();
  });

  it('compares only the themes it is given', async () => {
    const { queryByText, getAllByText } = await render(<ColorPalette themes={[THEMES.day]} />);
    expect(getAllByText(THEMES.day.colors.accent).length).toBeGreaterThan(0);
    expect(queryByText(THEMES.night.colors.background)).toBeNull();
  });

  it('speaks English when the language is English', async () => {
    const { getByText } = await render(inEnglish(<ColorPalette />));
    expect(getByText('Theme colors')).toBeTruthy();
    expect(getByText('Night · current theme')).toBeTruthy();
    expect(getByText(COLOR_TOKENS[0].description.en)).toBeTruthy();
  });
});
