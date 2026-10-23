import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '~sb/localized';
import { source } from '~sb/source';

import { FinalStandings } from './FinalStandings';
import multiplayerCode from './Multiplayer.source.md?raw';
import fourPlayersCode from './FourPlayers.source.md?raw';
import soloCode from './Solo.source.md?raw';
import tieCode from './Tie.source.md?raw';

const textArgs = (t: Translations) => ({ title: t.endScreen.title });

const meta = {
  title: 'Game/FinalStandings',
  component: FinalStandings,
  args: { ...textArgs(translations.fr), onReplay: () => {}, onQuit: () => {} },
  decorators: [localizedArgs(textArgs)],
} satisfies Meta<typeof FinalStandings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Classe du meilleur au moins bon ; le vainqueur est annonce en banniere des qu'il y a plusieurs joueurs. */
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

/** Des la 4e place, plus de medaille : le rang s'affiche en chiffre. */
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

/** Seul dans la room : pas de banniere de vainqueur, juste le score. */
export const Solo: Story = {
  parameters: source(soloCode),
  args: { entries: [{ name: 'Zoé', total: 1250 }] },
};
