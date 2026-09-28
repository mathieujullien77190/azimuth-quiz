import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SAMPLE_CLUE_BEARING, SAMPLE_CLUE_DISTANCE_KM, SAMPLE_CLUE_PLACE } from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { ClueGrid } from './ClueGrid';
import myTurnCode from './MyTurn.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';
import roundOverCode from './RoundOver.source.md?raw';

const meta = {
  title: 'Clues/ClueGrid',
  component: ClueGrid,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    distanceKm: SAMPLE_CLUE_DISTANCE_KM,
    place: SAMPLE_CLUE_PLACE,
    roundOver: false,
  },
} satisfies Meta<typeof ClueGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

/** It's this device's turn: the unrevealed cards can be picked (each pick also passes the turn). */
export const MyTurn: Story = {
  parameters: source(myTurnCode),
  args: { onPickClue: fn(), revealedClueIds: ['population', 'letter'] },
};

/** Somebody else's turn (or a joiner watching): `onPickClue` omitted, every card is read-only. */
export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { revealedClueIds: ['population', 'bearing', 'letter'] },
};

/** Round over: everything is shown, whatever was actually picked. */
export const RoundOver: Story = {
  parameters: source(roundOverCode),
  args: { revealedClueIds: ['population'], roundOver: true },
};
