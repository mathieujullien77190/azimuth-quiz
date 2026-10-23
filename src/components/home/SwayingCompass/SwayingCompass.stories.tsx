import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import { SwayingCompass } from './SwayingCompass';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Home/SwayingCompass',
  component: SwayingCompass,
  args: { size: 260 },
} satisfies Meta<typeof SwayingCompass>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Boussole de l'accueil : l'aiguille oscille sans fin entre deux caps. Suit le theme et la taille demandee. */
export const Default: Story = {
  parameters: source(defaultCode),
};
