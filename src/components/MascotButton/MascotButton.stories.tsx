import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeSettingsContext } from '@/themes';

import { MascotButton } from './MascotButton';

const meta = {
  title: 'Common/MascotButton',
  component: MascotButton,
} satisfies Meta<typeof MascotButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Follows `theme.isDark` directly, no color token: a flying saucer at night, a helicopter by
 * day. Each story below forces the theme (rather than a Storybook toolbar toggle) so both draw
 * side by side regardless of the app's actual default. */
export const Night: Story = {
  name: 'Night (UFO)',
  args: { accessibilityLabel: 'Réglages', onPress: () => {} },
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'night',
          ready: true,
          setThemeId: () => {},
          resetThemeId: () => {},
          animationsEnabled: false,
          setAnimationsEnabled: () => {},
          resetAnimationsEnabled: () => {},
        }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};

export const Day: Story = {
  name: 'Day (Helicopter)',
  args: { accessibilityLabel: 'Réglages', onPress: () => {} },
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{
          themeId: 'day',
          ready: true,
          setThemeId: () => {},
          resetThemeId: () => {},
          animationsEnabled: false,
          setAnimationsEnabled: () => {},
          resetAnimationsEnabled: () => {},
        }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};
