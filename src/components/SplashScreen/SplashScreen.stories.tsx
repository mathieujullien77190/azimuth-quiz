import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeSettingsContext } from '@/themes';
import { source } from '@/storybook/source';

import { SplashScreen } from './SplashScreen';
import dayCode from './Day.source.md?raw';
import nightCode from './Night.source.md?raw';

const meta = {
  title: 'Common/SplashScreen',
  component: SplashScreen,
  decorators: [
    (Story) => (
      <div style={{ width: 390, height: 844, position: 'relative', overflow: 'hidden' }}>
        <View style={{ flex: 1 }}>
          <Story />
        </View>
      </div>
    ),
  ],
} satisfies Meta<typeof SplashScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

const args = {
  visible: true,
  tagline: 'Pas de GPS, que de l’instinct.',
  loadingLabel: 'Chargement…',
  versionLabel: 'v2.64.1 - 🦥 - brown-throated-sloth',
  fillMs: 5000,
};

/** The startup splash by night: the needle of the compass swings, the bar jumps and stalls like a real loader over the minimum time (5 s), the
 * "loading" label breathes. Each story forces the theme (rather than the toolbar) so both draw side by side. */
export const Night: Story = {
  parameters: source(nightCode),
  args,
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{ themeId: 'night', ready: true, setThemeId: () => {}, resetThemeId: () => {} }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};

/** The same by day, for a player whose saved theme is the light one: sand background, white dial, blue title and bar. */
export const Day: Story = {
  parameters: source(dayCode),
  args,
  decorators: [
    (Story) => (
      <ThemeSettingsContext.Provider
        value={{ themeId: 'day', ready: true, setThemeId: () => {}, resetThemeId: () => {} }}
      >
        <Story />
      </ThemeSettingsContext.Provider>
    ),
  ],
};
