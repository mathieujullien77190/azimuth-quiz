import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '~sb/localized';
import type { Difficulty } from '@/types';

import { DifficultySection } from './DifficultySection';
import type { DifficultySectionProps } from './types';
import { source } from '~sb/source';
import singleSelectCode from './doc/SingleSelect.source.md?raw';
import readOnlyCode from './doc/ReadOnly.source.md?raw';

/** Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. */
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
  title: texts.setup.difficultyTitle,
  hint: texts.setup.difficultyHint,
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

/**
 * Un clic sur une puce remplace la selection, et est logge dans le panneau Actions
 * (`onSelect` enveloppe dans `fn()`).
 */
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
