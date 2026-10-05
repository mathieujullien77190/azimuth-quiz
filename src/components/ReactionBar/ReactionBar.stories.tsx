import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { REACTION_EMOJIS } from '@/data';
import { source } from '@/storybook/source';

import { ReactionBar } from './ReactionBar';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Common/ReactionBar',
  component: ReactionBar,
  decorators: [
    (Story) => (
      <div style={{ width: 360, height: 420, position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReactionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One small round button floating at the bottom-right corner, just above the footer it is a child of (here, the bottom
 * of the frame); a tap shows a column of emojis upward from it, against the right edge (44 px touch targets). A tap on an emoji calls back with it and leaves the column open, only the round button closes it. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { emojis: REACTION_EMOJIS, labelFor: (emoji: string) => `Envoyer ${emoji}`, onPick: fn(), toggleLabel: 'Réactions' },
};
