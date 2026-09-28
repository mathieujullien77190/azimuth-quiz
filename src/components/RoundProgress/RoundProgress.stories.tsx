import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import mixedDifficultiesCode from './MixedDifficulties.source.md?raw';
import { RoundProgress } from './RoundProgress';
import singleDifficultyCode from './SingleDifficulty.source.md?raw';

const meta = {
  title: 'UI/RoundProgress',
  component: RoundProgress,
} satisfies Meta<typeof RoundProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One left-aligned line: the round, then the round's difficulty. */
export const SingleDifficulty: Story = {
  name: 'Intermediate',
  parameters: source(singleDifficultyCode),
  args: { difficulty: 'intermediate', roundNumber: 3, totalRounds: 10 },
};

export const MixedDifficulties: Story = {
  name: 'Hard, twenty rounds',
  parameters: source(mixedDifficultiesCode),
  args: { difficulty: 'hard', roundNumber: 7, totalRounds: 20 },
};
