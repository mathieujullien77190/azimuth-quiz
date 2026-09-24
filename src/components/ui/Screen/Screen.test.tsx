import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { ThemeSettingsContext, day } from '@/themes';

import Screen from '.';

describe('Screen', () => {
  it('renders children, and header/footer when given', async () => {
    const { getByText } = await render(
      <Screen footer={<Text>Footer</Text>} header={<Text>Header</Text>}>
        <Text>Body</Text>
      </Screen>,
    );
    expect(getByText('Header')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });

  it('renders no footer wrapper when none is given', async () => {
    const { queryByText } = await render(
      <Screen>
        <Text>Body</Text>
      </Screen>,
    );
    expect(queryByText('Footer')).toBeNull();
  });

  it('gives the footer a white background by day instead of the page background', async () => {
    const { toJSON } = await render(
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: jest.fn(), resetThemeId: jest.fn(), animationsEnabled: false, setAnimationsEnabled: jest.fn(), resetAnimationsEnabled: jest.fn() }}
      >
        <Screen footer={<Text>Footer</Text>}>
          <Text>Body</Text>
        </Screen>
      </ThemeSettingsContext.Provider>,
    );
    expect(JSON.stringify(toJSON())).toContain(day.colors.surface);
  });
});
