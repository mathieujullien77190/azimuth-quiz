import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '@/storybook/source';

import accentCode from './Accent.source.md?raw';
import baseCode from './Base.source.md?raw';
import { QuitButton } from './QuitButton';

const meta = {
  title: 'UI/QuitButton',
  component: QuitButton,
} satisfies Meta<typeof QuitButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A cross in a circle, in the normal text color: the in-game headers'. */
export const Base: Story = {
  parameters: source(baseCode),
  args: { onPress: fn(), variant: 'base' },
};

/** A plain cross in the accent color, no circle: the setup screens'. */
export const Accent: Story = {
  parameters: source(accentCode),
  args: { onPress: fn(), variant: 'accent' },
};
