import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Toggle } from '../Toggle';
import type { ToggleProps } from '../types';
import { source } from '~sb/source';
import defaultCode from './Default.source.md?raw';
import disabledCode from './Disabled.source.md?raw';

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. `Toggle` est controle par son
 * appelant : la demo garde la valeur, donc un clic la bascule vraiment, et reste logge dans Actions
 * (`onValueChange` dans `fn()`).
 */
const InteractiveDemo = (args: ToggleProps) => {
  const [value, setValue] = useState(args.value);
  return (
    <Toggle
      {...args}
      onValueChange={(next) => {
        args.onValueChange(next);
        // Un toggle desactive est seulement grise : l'appelant decide de l'effet d'un appui (ici, rien).
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

/** Cliquer : l'interrupteur bascule. */
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

/**
 * Grise, et un clic ne change rien ici : `disabled` ne grise que la ligne, l'interrupteur reste cliquable (le
 * clic est logge dans Actions) pour que l'appelant explique pourquoi, comme les setups le font pour un joiner.
 */
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
