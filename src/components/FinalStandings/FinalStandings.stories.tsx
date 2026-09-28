import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { translations } from '@/i18n/translations';
import { source } from '@/storybook/source';

import { FinalStandings } from './FinalStandings';
import multiplayerCode from './Multiplayer.source.md?raw';
import soloCode from './Solo.source.md?raw';
import tieCode from './Tie.source.md?raw';

const t = translations.fr;

const meta = {
  title: 'Common/FinalStandings',
  component: FinalStandings,
  args: { homeLabel: t.contourGame.home, onHome: fn(), title: t.contourGame.finalScoreTitle },
} satisfies Meta<typeof FinalStandings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Ranked best first, with the winner announced as a banner once there's more than one player. */
export const Multiplayer: Story = {
  parameters: source(multiplayerCode),
  args: {
    entries: [
      { name: 'Zoé', total: 1250 },
      { name: 'Max', total: 2100 },
      { name: 'Léa', total: 800 },
    ],
  },
};

export const Tie: Story = {
  parameters: source(tieCode),
  args: {
    entries: [
      { name: 'Zoé', total: 1500 },
      { name: 'Max', total: 1500 },
      { name: 'Léa', total: 800 },
    ],
  },
};

/** Alone in the room: no winner banner, just the score. */
export const Solo: Story = {
  parameters: source(soloCode),
  args: { entries: [{ name: 'Zoé', total: 1250 }] },
};
