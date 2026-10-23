import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '~sb/source';

import accentCode from './Accent.source.md?raw';
import baseCode from './Base.source.md?raw';
import { QuitButton } from './QuitButton';

const meta = {
  title: 'UI/QuitButton',
  component: QuitButton,
} satisfies Meta<typeof QuitButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Croix dans un cercle, couleur de texte normale : celle des headers de jeu. */
export const Base: Story = {
  parameters: source(baseCode),
  args: { onPress: fn(), variant: 'base' },
};

/** Croix simple couleur d'accent, sans cercle : celle des ecrans de setup. */
export const Accent: Story = {
  parameters: source(accentCode),
  args: { onPress: fn(), variant: 'accent' },
};
