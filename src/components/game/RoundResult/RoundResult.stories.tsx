import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS, SAMPLE_ROUND_RECORD, SAMPLE_TOTALS } from '@/helpers/storyFixtures';

import { RoundResult } from './RoundResult';
import { source } from '~sb/source';
import surfaceModeCode from './SurfaceMode.source.md?raw';

const meta = {
  title: 'Game/RoundResult',
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

/** Les scores viennent des vrais `scoreRound`/`applyBestBonus`, pas de chiffres inventes. */
export const SurfaceMode: Story = {
  parameters: source(surfaceModeCode),
  args: {
    players: SAMPLE_PLAYERS,
    record: SAMPLE_ROUND_RECORD,
    totals: SAMPLE_TOTALS,
  },
};
