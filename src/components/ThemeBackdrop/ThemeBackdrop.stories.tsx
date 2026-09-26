import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeBackdrop } from './ThemeBackdrop';

const meta = {
  title: 'Common/ThemeBackdrop',
  component: ThemeBackdrop,
  // Fills its parent absolutely (`useWindowDimensions`-driven SVG) — needs a sized, clipped
  // ancestor to preview at a reasonable size instead of covering the whole page.
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 320, height: 160, overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThemeBackdrop>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
