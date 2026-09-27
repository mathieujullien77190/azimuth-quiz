import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { GameHeader } from './GameHeader';

const meta = {
  title: 'Common/GameHeader',
  component: GameHeader,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Compass' own local guess phase: a running score, always visible. */
export const Default: Story = {
  args: {
    onQuit: fn(),
    scoreLabel: '1 250 pts',
    roundNumber: 3,
    totalRounds: 10,
    difficulties: ['intermediate'],
  },
};

/** Silhouette's own guess phase: score replaced by the current tier's points-at-stake, and the
 * "Quel est ce pays ?" prompt slotted in below the round dots via `children`. */
export const WithPrompt: Story = {
  args: {
    onQuit: fn(),
    scoreLabel: '500 pts',
    roundNumber: 1,
    totalRounds: 5,
    difficulties: ['easy'],
    children: <p style={{ textAlign: 'center', fontWeight: 700 }}>Quel est ce pays ?</p>,
  },
};

/** Silhouette's own reveal phase: no score in the header at all (shown in the footer instead,
 * next to the "next round" button). */
export const NoScore: Story = {
  args: {
    onQuit: fn(),
    roundNumber: 3,
    totalRounds: 10,
    difficulties: ['hard'],
  },
};
