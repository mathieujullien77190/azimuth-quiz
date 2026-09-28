import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';
import { THEMES, ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

import { ColorPalette } from './ColorPalette';
import dayCode from './Day.source.md?raw';
import defaultCode from './Default.source.md?raw';
import nightCode from './Night.source.md?raw';

/** Renders the story in one theme whatever the toolbar says — on that theme's own background, so the
 * palette is seen the way a screen of that theme shows it. */
const pinnedTo = (themeId: ThemeId): Decorator => {
  const PinnedTheme: Decorator = (Story) => (
    <ThemeSettingsContext.Provider
      value={{
        themeId,
        ready: true,
        setThemeId: () => {},
        resetThemeId: () => {},
        animationsEnabled: false,
        setAnimationsEnabled: () => {},
        resetAnimationsEnabled: () => {},
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
  title: 'Common/ColorPalette',
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

/** Night and Day side by side. Switch the toolbar's theme or language: the highlighted column, the
 * texts and the panel around the table follow. */
export const Default: Story = {
  parameters: source(defaultCode),
};

/** Night on its own, drawn in Night. */
export const Night: Story = {
  parameters: source(nightCode),
  args: { themes: [THEMES.night] },
  decorators: [pinnedTo('night')],
};

/** Day on its own, drawn in Day. */
export const Day: Story = {
  parameters: source(dayCode),
  args: { themes: [THEMES.day] },
  decorators: [pinnedTo('day')],
};
