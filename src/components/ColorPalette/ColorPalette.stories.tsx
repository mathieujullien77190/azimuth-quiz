import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';
import { THEMES } from '@/themes';

import { ColorPalette } from './ColorPalette';
import defaultCode from './Default.source.md?raw';
import oneThemeCode from './OneTheme.source.md?raw';

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

export const OneTheme: Story = {
  parameters: source(oneThemeCode),
  args: { themes: [THEMES.day] },
};
