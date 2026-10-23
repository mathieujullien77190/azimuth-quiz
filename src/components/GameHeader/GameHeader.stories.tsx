import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { GameHeader } from './GameHeader';
import plainCode from './Plain.source.md?raw';
import withLocationCode from './WithLocation.source.md?raw';
import withPlayersCode from './WithPlayers.source.md?raw';

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

/** Sans `players` ni `question` : croix et code, nom et points, ligne "Manche 3 / 10 · difficulte" —
 * Boussole, ou tout le monde repond en meme temps. */
export const Plain: Story = {
  name: 'Without players, without question',
  parameters: source(plainCode),
};

/** Avec `players` : les onglets disant qui joue et a qui est le tour (`turnIndex`) — Indices. */
export const WithPlayers: Story = {
  name: 'With players',
  parameters: source(withPlayersCode),
  args: { players: SAMPLE_PLAYERS, turnIndex: 1 },
};

/** Mode voyage (Boussole) : ou se trouve le joueur, en blanc sous la ligne de manche. */
export const WithLocation: Story = {
  name: 'With a location (travel mode)',
  parameters: source(withLocationCode),
  args: { location: 'Vous êtes à Cusco' },
};
