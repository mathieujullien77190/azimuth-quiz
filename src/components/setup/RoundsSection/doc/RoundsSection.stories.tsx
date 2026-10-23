import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { RoundsSection } from '../RoundsSection';
import type { RoundsSectionProps } from '../types';
import { source } from '~sb/source';
import defaultCode from './Default.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

/** Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. */
const InteractiveDemo = (args: RoundsSectionProps) => {
  const [rounds, setRounds] = useState(args.rounds);
  return (
    <RoundsSection
      {...args}
      onSelect={(value) => {
        args.onSelect(value);
        setRounds(value);
      }}
      rounds={rounds}
    />
  );
};

const meta = {
  title: 'Setup/RoundsSection',
  component: RoundsSection,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Un clic sur une autre puce la re-selectionne (state local de la story ; `RoundsSection` reste controle) et
 * apparait dans le panneau Actions (`onSelect` enveloppe dans `fn()`).
 */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { rounds: 10, onSelect: fn() },
  render: InteractiveDemo,
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { rounds: 5, onSelect: fn(), disabled: true },
};
