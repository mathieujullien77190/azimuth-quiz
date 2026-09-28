import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '@/storybook/source';

import accentCode from './Accent.source.md?raw';
import dangerCode from './Danger.source.md?raw';
import { MiniButton } from './MiniButton';

const meta = {
  title: 'UI/MiniButton',
  component: MiniButton,
  args: { onPress: fn() },
} satisfies Meta<typeof MiniButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default: outlined in the accent color — a secondary action ("how are points computed"). */
export const Accent: Story = {
  parameters: source(accentCode),
  args: { label: 'Comment les points sont calculés', variant: 'accent' },
};

/** Red, for a destructive action: the host expelling a player. */
export const Danger: Story = {
  parameters: source(dangerCode),
  args: { label: 'Expulser', variant: 'danger' },
};
