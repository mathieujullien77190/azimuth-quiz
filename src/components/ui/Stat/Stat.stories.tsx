import type { Meta, StoryObj } from '@storybook/react-vite';

import { THEMES } from '@/themes';

import Stat from './Stat';
import { source } from '@/storybook/source';
import scoreCode from './Score.source.md?raw';
import withColorCode from './WithColor.source.md?raw';

const meta = {
  title: 'Common/ui/Stat',
  component: Stat,
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Score: Story = {
  parameters: source(scoreCode),
  args: { label: 'Score', value: '1 250' },
};

export const WithColor: Story = {
  parameters: source(withColorCode),
  name: 'With a theme color',
  args: { color: THEMES.night.colors.success, label: 'Cap', value: '042°' },
};
