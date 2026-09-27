import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';

import { PlayerTabs } from './PlayerTabs';

const meta = {
  title: 'Common/PlayerTabs',
  component: PlayerTabs,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clues/Silhouette: tappable, unlocked (`allowRevision`) — a submitted tab reopens. */
export const RevisableTurnByTurn: Story = {
  name: 'Tappable (Clues/Silhouette)',
  args: {
    activeIndex: 1,
    activeLabel: (name) => translations.fr.game.playerTurn(name),
    allowRevision: true,
    answered: [true, false, false],
    onSelect: () => {},
    order: [0, 1, 2],
    players: SAMPLE_PLAYERS,
  },
};

/** Compass: `onSelect` omitted — status-only, no tab is tappable. */
export const InformationalOnly: Story = {
  name: 'Purely informational (Compass)',
  args: {
    activeIndex: 1,
    answered: [true, false, false],
    order: [0, 1, 2],
    players: SAMPLE_PLAYERS,
  },
};
