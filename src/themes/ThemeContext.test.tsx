import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { day } from './day';
import { night } from './night';
import { THEMES, useTheme, useThemeSettings } from './ThemeContext';

describe('THEMES', () => {
  it('maps every ThemeId to its theme object', () => {
    expect(THEMES.night).toBe(night);
    expect(THEMES.day).toBe(day);
  });
});

// No <ThemeProvider> here on purpose: exercises the context's default value (used by any
// component rendered outside one, which should never happen in the real app but must still be
// a harmless, non-crashing default — same reasoning as LanguageContext's).
const Probe = () => {
  const { themeId, ready, setThemeId, resetThemeId } = useThemeSettings();
  const theme = useTheme();
  return (
    <>
      <Text testID="themeId">{themeId}</Text>
      <Text testID="ready">{String(ready)}</Text>
      <Text testID="themeName">{theme.name}</Text>
      <Text onPress={() => setThemeId('day')} testID="setDay">
        setDay
      </Text>
      <Text onPress={resetThemeId} testID="reset">
        reset
      </Text>
    </>
  );
};

describe('default context value (no Provider)', () => {
  it('defaults to the Night theme, already "ready"', async () => {
    const { getByTestId } = await render(<Probe />);
    expect(getByTestId('themeId').props.children).toBe('night');
    expect(getByTestId('ready').props.children).toBe('true');
    expect(getByTestId('themeName').props.children).toBe(night.name);
  });

  it('setThemeId/resetThemeId are harmless no-ops (nothing to update without a Provider)', async () => {
    const { getByTestId } = await render(<Probe />);
    await fireEvent.press(getByTestId('setDay'));
    await fireEvent.press(getByTestId('reset'));
    // Still Night: the default context's setters don't actually change anything.
    expect(getByTestId('themeId').props.children).toBe('night');
  });
});
