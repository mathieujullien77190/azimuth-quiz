import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import NoOneFoundText from './NoOneFoundText';
import severalCode from './Several.source.md?raw';
import soloCode from './Solo.source.md?raw';

const meta = {
  title: 'Common/ui/NoOneFoundText',
  component: NoOneFoundText,
} satisfies Meta<typeof NoOneFoundText>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Alone, it names the player instead of the generic "nobody" — there's no one else it could be. */
export const Solo: Story = {
  parameters: source(soloCode),
  args: { players: ['Zoé'] },
};

export const Several: Story = {
  parameters: source(severalCode),
  args: { players: ['Zoé', 'Max', 'Léa'] },
};
