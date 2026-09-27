import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS, SAMPLE_ROUND_RECORD, SAMPLE_TOTALS } from '@/helpers/storyFixtures';

import { RoundResult } from './RoundResult';

const meta = {
  title: 'Boussole/RoundResult',
  component: RoundResult,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoundResult>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every score here comes from the real `scoreRound`/`applyBestBonus` helpers fed three plausible
 * guesses (one near-perfect, one overshooting, one wide off) — not invented numbers. */
export const SurfaceMode: Story = {
  args: {
    options: { straightLine: false },
    players: SAMPLE_PLAYERS,
    record: SAMPLE_ROUND_RECORD,
    totals: SAMPLE_TOTALS,
  },
};
