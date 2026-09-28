import { render } from '@testing-library/react-native';

import { LanguageContext } from '@/i18n';
import { ThemeSettingsContext } from '@/themes';

import DifficultyBadge from '.';

describe('DifficultyBadge', () => {
  it.each([
    ['easy', '🟢 Facile'],
    ['intermediate', '🟠 Moyen'],
    ['hard', '🔴 Difficile'],
  ] as const)('shows the %s difficulty as an emoji and its label', async (difficulty, expected) => {
    const { getByText } = await render(<DifficultyBadge difficulty={difficulty} />);
    expect(getByText(expected)).toBeTruthy();
  });

  it('swaps the intermediate dot by day, where the orange one would vanish', async () => {
    const { getByText } = await render(
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'day',
          ready: true,
          setThemeId: jest.fn(),
          resetThemeId: jest.fn(),
          animationsEnabled: false,
          setAnimationsEnabled: jest.fn(),
          resetAnimationsEnabled: jest.fn(),
        }}
      >
        <DifficultyBadge difficulty="intermediate" />
      </ThemeSettingsContext.Provider>,
    );
    expect(getByText('🟡 Moyen')).toBeTruthy();
  });

  it('speaks English when the language is English', async () => {
    const { getByText } = await render(
      <LanguageContext.Provider
        value={{ language: 'en', ready: true, setLanguage: jest.fn(), resetLanguage: jest.fn() }}
      >
        <DifficultyBadge difficulty="hard" />
      </LanguageContext.Provider>,
    );
    expect(getByText(/Hard/)).toBeTruthy();
  });
});
