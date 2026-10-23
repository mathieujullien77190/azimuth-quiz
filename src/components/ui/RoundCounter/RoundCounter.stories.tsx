import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';

import defaultCode from './doc/Default.source.md?raw';
import { RoundCounter } from './RoundCounter';

const meta = {
  title: 'UI/RoundCounter',
  component: RoundCounter,
} satisfies Meta<typeof RoundCounter>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Ou en est la partie : « Manche 3 / 10 » (ou « Round 3 / 10 » selon la langue de la barre d'outils). */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { roundNumber: 3, totalRounds: 10 },
};

export const TwentyRounds: Story = {
  name: 'Twenty rounds',
  parameters: source(defaultCode),
  args: { roundNumber: 17, totalRounds: 20 },
};
