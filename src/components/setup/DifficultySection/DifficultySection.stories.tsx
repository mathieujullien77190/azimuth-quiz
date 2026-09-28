import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
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

const singleSelectText = (texts: Translations) => ({
  title: texts.cluesSetup.difficultyTitle,
  hint: texts.cluesSetup.difficultyHint,
});
const readOnlyText = (texts: Translations) => ({
  title: texts.setup.difficultyTitle,
  hint: texts.setup.difficultyHint,
});

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
    ...singleSelectText(t),
    selected: 'intermediate',
    onSelect: fn(),
  },
  decorators: [localizedArgs(singleSelectText)],
  render: SingleSelectDemo,
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: {
    ...readOnlyText(t),
    selected: 'intermediate',
    onSelect: fn(),
    disabled: true,
  },
  decorators: [localizedArgs(readOnlyText)],
};
