import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { RoundCounter } from './RoundCounter';

const meta = {
  title: 'Common/RoundCounter',
  component: RoundCounter,
} satisfies Meta<typeof RoundCounter>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Where the game is: "Manche 3 / 10" (or "Round 3 / 10", following the toolbar's language). */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { roundNumber: 3, totalRounds: 10 },
};

export const TwentyRounds: Story = {
  name: 'Twenty rounds',
  parameters: source(defaultCode),
  args: { roundNumber: 17, totalRounds: 20 },
};
