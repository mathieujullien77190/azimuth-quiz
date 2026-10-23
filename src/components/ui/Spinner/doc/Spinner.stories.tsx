import type { Meta, StoryObj } from '@storybook/react-vite';

import { PLAYER_COLORS } from '@/data';
import { source } from '~sb/source';

import largeLightCode from './LargeLight.source.md?raw';
import playerColorCode from './PlayerColor.source.md?raw';
import smallAccentCode from './SmallAccent.source.md?raw';
import { Spinner } from '../Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Par defaut : petit, couleur d'accent de l'app. */
export const SmallAccent: Story = {
  name: 'Small, accent',
  parameters: source(smallAccentCode),
};

/** Couleur du joueur attendu (resultat de manche, avant sa reponse). */
export const PlayerColor: Story = {
  name: 'Small, player color',
  parameters: source(playerColorCode),
  args: { color: PLAYER_COLORS[1], size: 'small' },
};

/** Grand et gris clair, sur le fond sombre du splash de notice. */
export const LargeLight: Story = {
  name: 'Large, light (on dark)',
  parameters: source(largeLightCode),
  args: { color: '#D1D5DB', size: 'large' },
  decorators: [
    (Story) => (
      <div style={{ background: 'rgba(0, 0, 0, 0.8)', padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};
