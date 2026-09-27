import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { RoundsSection } from './RoundsSection';
import type { RoundsSectionProps } from './types';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. */
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
  title: 'Common/Setup/RoundsSection',
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

/** Clicking a different chip actually re-selects it (local state in the story, not the
 * component — `RoundsSection` itself stays fully controlled by its caller) — and shows up in the
 * Actions panel below, `onSelect` wrapped in `fn()`. */
export const Default: Story = {
  args: { rounds: 10, onSelect: fn() },
  render: InteractiveDemo,
};

export const ReadOnly: Story = {
  args: { rounds: 5, onSelect: fn(), disabled: true },
};
