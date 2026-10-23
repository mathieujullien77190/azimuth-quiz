import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '~sb/source';

import defaultCode from './Default.source.md?raw';
import { DifficultyBadge } from '../DifficultyBadge';

const meta = {
  title: 'UI/DifficultyBadge',
  component: DifficultyBadge,
} satisfies Meta<typeof DifficultyBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Difficulte de la manche : emoji et libelle, dans la langue de la barre d'outils. */
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
