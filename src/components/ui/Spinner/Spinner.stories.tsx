import type { Meta, StoryObj } from '@storybook/react-vite';

import { PLAYER_COLORS } from '@/data';
import { source } from '@/storybook/source';

import largeLightCode from './LargeLight.source.md?raw';
import playerColorCode from './PlayerColor.source.md?raw';
import smallAccentCode from './SmallAccent.source.md?raw';
import { Spinner } from './Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default: small, in the app's accent color. */
export const SmallAccent: Story = {
  name: 'Small, accent',
  parameters: source(smallAccentCode),
};

/** In the color of the player being waited for (the round result, before their answer is in). */
export const PlayerColor: Story = {
  name: 'Small, player color',
  parameters: source(playerColorCode),
  args: { color: PLAYER_COLORS[1], size: 'small' },
};

/** Large and light grey, on the notice splash's dark backdrop ("Préparation de la partie…"). */
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
