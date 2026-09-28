import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { GameHeader } from './GameHeader';
import plainCode from './Plain.source.md?raw';
import withPlayersCode from './WithPlayers.source.md?raw';
import withQuestionCode from './WithQuestion.source.md?raw';

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
  args: {
    code: 'tabofuna',
    difficulty: 'intermediate',
    name: 'Zoé',
    onQuit: fn(),
    points: 1250,
    roundNumber: 3,
    totalRounds: 10,
  },
} satisfies Meta<typeof GameHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Without `players` and without `question`: the cross and code, the name and points, and the
 * "Manche 3 / 10 · difficulté" line — Compass, where everyone answers at once. */
export const Plain: Story = {
  name: 'Without players, without question',
  parameters: source(plainCode),
};

/** With `players`: the tabs saying who's playing and whose turn it is (`turnIndex`) — Clues. */
export const WithPlayers: Story = {
  name: 'With players',
  parameters: source(withPlayersCode),
  args: { players: SAMPLE_PLAYERS, turnIndex: 1 },
};

/** With a `question`, centered at the bottom of the header — Silhouette's "Quel est ce pays ?". */
export const WithQuestion: Story = {
  name: 'With a question',
  parameters: source(withQuestionCode),
  args: { difficulty: 'easy', points: 500, question: 'Quel est ce pays ?', roundNumber: 1, totalRounds: 5 },
};
