import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeSettingsContext } from '@/themes';

import { MascotButton } from './MascotButton';
import { source } from '~sb/source';
import nightCode from './Night.source.md?raw';
import dayCode from './Day.source.md?raw';

const meta = {
  title: 'Home/MascotButton',
  component: MascotButton,
} satisfies Meta<typeof MascotButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Suit `theme.isDark` : soucoupe la nuit, helicoptere le jour. Chaque story force le theme pour afficher les deux. */
export const Night: Story = {
  parameters: source(nightCode),
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
        }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};

export const Day: Story = {
  parameters: source(dayCode),
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
        }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};
