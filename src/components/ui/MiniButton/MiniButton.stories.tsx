import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '~sb/source';

import accentCode from './doc/Accent.source.md?raw';
import dangerCode from './doc/Danger.source.md?raw';
import { MiniButton } from './MiniButton';

const meta = {
  title: 'UI/MiniButton',
  component: MiniButton,
  args: { onPress: fn() },
} satisfies Meta<typeof MiniButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Par defaut : contour de la couleur d'accent, action secondaire (« comment sont calcules les points »). */
export const Accent: Story = {
  parameters: source(accentCode),
  args: { label: 'Comment les points sont calculés', variant: 'accent' },
};

/** Rouge, pour une action destructive : l'hote qui expulse un joueur. */
export const Danger: Story = {
  parameters: source(dangerCode),
  args: { label: 'Expulser', variant: 'danger' },
};
