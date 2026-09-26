import type { Meta, StoryObj } from '@storybook/react-vite';

import { THEMES } from '@/themes';

import Stat from './Stat';

const meta = {
  title: 'Common/ui/Stat',
  component: Stat,
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Score: Story = {
  args: { label: 'Score', value: '1 250' },
};

export const WithColor: Story = {
  name: 'With a theme color',
  args: { color: THEMES.night.colors.success, label: 'Cap', value: '042°' },
};
