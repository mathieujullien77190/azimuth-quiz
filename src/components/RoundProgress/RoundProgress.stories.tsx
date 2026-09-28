import type { Meta, StoryObj } from '@storybook/react-vite';

import RoundProgress from './RoundProgress';

const meta = {
  title: 'Common/ui/RoundProgress',
  component: RoundProgress,
} satisfies Meta<typeof RoundProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleDifficulty: Story = {
  args: { difficulties: ['intermediate'], roundNumber: 3, totalRounds: 10 },
};

export const MixedDifficulties: Story = {
  args: { difficulties: ['easy', 'hard'], roundNumber: 7, totalRounds: 20 },
};

/** Online game: the room code sits right after the difficulty. */
export const WithRoomCode: Story = {
  args: { difficulties: ['intermediate'], roundNumber: 3, totalRounds: 10, roomCode: 'keba' },
};
