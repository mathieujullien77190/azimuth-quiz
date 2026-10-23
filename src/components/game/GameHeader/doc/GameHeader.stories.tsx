import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '~sb/source';

import { GameHeader } from '../GameHeader';
import plainCode from './Plain.source.md?raw';
import withLocationCode from './WithLocation.source.md?raw';

const meta = {
  title: 'Game/GameHeader',
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

/** Croix et code, nom et points, ligne "Manche 3 / 10 · difficulte" */
export const Plain: Story = {
  name: 'Plain',
  parameters: source(plainCode),
};

/** Mode voyage (Boussole) : ou se trouve le joueur, en blanc sous la ligne de manche. */
export const WithLocation: Story = {
  name: 'With a location (travel mode)',
  parameters: source(withLocationCode),
  args: { location: 'Vous êtes à Cusco' },
};
