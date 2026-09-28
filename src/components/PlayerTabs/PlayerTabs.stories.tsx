import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';

import { PlayerTabs } from './PlayerTabs';
import { source } from '@/storybook/source';
import turnByTurnCode from './TurnByTurn.source.md?raw';

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

/** Status only, no tab is tappable: the active one says whose turn it is. */
export const TurnByTurn: Story = {
  parameters: source(turnByTurnCode),
  decorators: [localizedArgs((t) => ({ activeLabel: (name: string) => t.game.playerTurn(name) }))],
  args: {
    activeIndex: 1,
    activeLabel: (name) => translations.fr.game.playerTurn(name),
    order: [0, 1, 2],
    players: SAMPLE_PLAYERS,
  },
};
