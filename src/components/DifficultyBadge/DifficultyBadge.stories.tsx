import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { DifficultyBadge } from './DifficultyBadge';

const meta = {
  title: 'Common/DifficultyBadge',
  component: DifficultyBadge,
} satisfies Meta<typeof DifficultyBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The round's difficulty: its emoji and its label, in the toolbar's language. */
export const Easy: Story = {
  parameters: source(defaultCode),
  args: { difficulty: 'easy' },
};

export const Intermediate: Story = {
  parameters: source(defaultCode),
  args: { difficulty: 'intermediate' },
};

export const Hard: Story = {
  parameters: source(defaultCode),
  args: { difficulty: 'hard' },
};
