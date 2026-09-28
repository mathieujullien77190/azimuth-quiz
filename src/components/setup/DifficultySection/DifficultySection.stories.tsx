import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { translations } from '@/i18n/translations';
import type { Difficulty } from '@/types';

import { DifficultySection } from './DifficultySection';
import type { DifficultySectionProps } from './types';
import { source } from '@/storybook/source';
import singleSelectCode from './SingleSelect.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. */
const SingleSelectDemo = (args: DifficultySectionProps) => {
  const [selected, setSelected] = useState<Difficulty>(args.selected);
  return (
    <DifficultySection
      {...args}
      onSelect={(id) => {
        args.onSelect(id);
        setSelected(id);
      }}
      selected={selected}
    />
  );
};

const t = translations.fr;

const meta = {
  title: 'Setup/DifficultySection',
  component: DifficultySection,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DifficultySection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every game: clicking a chip replaces the selection — each click also logged in the Actions
 * panel (`onSelect` wrapped in `fn()`). */
export const SingleSelect: Story = {
  parameters: source(singleSelectCode),
  args: {
    title: t.cluesSetup.difficultyTitle,
    hint: t.cluesSetup.difficultyHint,
    selected: 'intermediate',
    onSelect: fn(),
  },
  render: SingleSelectDemo,
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: {
    title: t.setup.difficultyTitle,
    hint: t.setup.difficultyHint,
    selected: 'intermediate',
    onSelect: fn(),
    disabled: true,
  },
};
