import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';
import { THEMES, ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

import { ColorPalette } from './ColorPalette';
import dayCode from './Day.source.md?raw';
import defaultCode from './Default.source.md?raw';
import nightCode from './Night.source.md?raw';

/** Rend la story dans un seul theme, sur le fond de ce theme, quel que soit celui de la barre d'outils. */
const pinnedTo = (themeId: ThemeId): Decorator => {
  const PinnedTheme: Decorator = (Story) => (
    <ThemeSettingsContext.Provider
      value={{
        themeId,
        ready: true,
        setThemeId: () => {},
        resetThemeId: () => {},
      }}
    >
      <div style={{ background: THEMES[themeId].colors.background, padding: 24, minHeight: '100vh' }}>
        <Story />
      </div>
    </ThemeSettingsContext.Provider>
  );
  return PinnedTheme;
};

const meta = {
  title: 'UI/ColorPalette',
  component: ColorPalette,
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ColorPalette>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Night et Day cote a cote ; la colonne mise en avant suit le theme de la barre d'outils. */
export const Default: Story = {
  parameters: source(defaultCode),
};

/** Night seul. */
export const Night: Story = {
  parameters: source(nightCode),
  args: { themes: [THEMES.night] },
  decorators: [pinnedTo('night')],
};

/** Day seul. */
export const Day: Story = {
  parameters: source(dayCode),
  args: { themes: [THEMES.day] },
  decorators: [pinnedTo('day')],
};
