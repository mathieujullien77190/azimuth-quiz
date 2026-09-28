import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Toggle } from './Toggle';
import type { ToggleProps } from './types';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';
import disabledCode from './Disabled.source.md?raw';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. `Toggle` itself
 * is fully controlled by its caller: the demo keeps the value, so a click really flips it — and is
 * still logged in the Actions panel (`onValueChange` wrapped in `fn()`). */
const InteractiveDemo = (args: ToggleProps) => {
  const [value, setValue] = useState(args.value);
  return (
    <Toggle
      {...args}
      onValueChange={(next) => {
        args.onValueChange(next);
        // A disabled toggle only dims: the caller decides what a press does — here, nothing.
        if (!args.disabled) setValue(next);
      }}
      value={value}
    />
  );
};

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  render: InteractiveDemo,
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Click it: the switch flips. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    label: 'Une option',
    description: 'Une description optionnelle.',
    value: true,
    onValueChange: fn(),
  },
};

export const Off: Story = {
  parameters: source(defaultCode),
  args: { label: 'Une option', value: false, onValueChange: fn() },
};

/** Dimmed, and a click changes nothing here: `disabled` only dims the row — the switch stays tappable
 * (the click is still logged in Actions) so the caller can explain why, as the setup screens do for a joiner. */
export const Disabled: Story = {
  parameters: source(disabledCode),
  args: {
    label: 'Une option',
    description: 'Réservé à l’hôte.',
    value: true,
    disabled: true,
    onValueChange: fn(),
  },
};
