import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import { FinalStandings } from './FinalStandings';
import multiplayerCode from './Multiplayer.source.md?raw';
import fourPlayersCode from './FourPlayers.source.md?raw';
import soloCode from './Solo.source.md?raw';
import tieCode from './Tie.source.md?raw';

const textArgs = (t: Translations) => ({ title: t.endScreen.title });

const meta = {
  title: 'Common/FinalStandings',
  component: FinalStandings,
  args: { ...textArgs(translations.fr), onReplay: () => {}, onQuit: () => {} },
  decorators: [localizedArgs(textArgs)],
} satisfies Meta<typeof FinalStandings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Ranked best first, with the winner announced as a banner once there's more than one player. */
export const Multiplayer: Story = {
  parameters: source(multiplayerCode),
  args: {
    entries: [
      { name: 'Zoé', total: 1250, color: '#EF4444' },
      { name: 'Max', total: 2100, color: '#3B82F6' },
      { name: 'Léa', total: 800, color: '#16A34A' },
    ],
  },
};

/** From the fourth place on there is no medal: the rank shows as a number. */
export const FourPlayers: Story = {
  name: 'Four players',
  parameters: source(fourPlayersCode),
  args: {
    entries: [
      { name: 'Zoé', total: 1250, color: '#EF4444' },
      { name: 'Max', total: 2100, color: '#3B82F6' },
      { name: 'Léa', total: 800, color: '#16A34A' },
      { name: 'Eve', total: 450, color: '#F59E0B' },
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
