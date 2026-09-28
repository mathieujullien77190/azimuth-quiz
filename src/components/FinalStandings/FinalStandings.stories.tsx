import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import { FinalStandings } from './FinalStandings';
import multiplayerCode from './Multiplayer.source.md?raw';
import recapCode from './Recap.source.md?raw';
import soloCode from './Solo.source.md?raw';
import soloRankCode from './SoloRank.source.md?raw';
import tieCode from './Tie.source.md?raw';

const textArgs = (t: Translations) => ({ homeLabel: t.endScreen.menu, title: t.endScreen.title });

const meta = {
  title: 'Common/FinalStandings',
  component: FinalStandings,
  args: { ...textArgs(translations.fr), onHome: fn() },
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

/** Compass' rounds recap: who was best at the heading and at the distance, round by round. */
const recapArgs = (t: Translations) => ({
  recap: {
    title: t.endScreen.recapTitle,
    columns: [t.roundResult.direction, t.roundResult.distance],
    rows: [
      {
        label: 'Paris',
        cells: [
          { text: 'Zoé', detail: '+400', color: '#EF4444' },
          { text: 'Max', detail: '+350', color: '#3B82F6' },
        ],
      },
      {
        label: 'Tokyo',
        cells: [
          { text: 'Zoé, Max', detail: '+300' },
          { text: 'Léa', detail: '+280', color: '#16A34A' },
        ],
      },
      { label: 'Nairobi', cells: [{ text: 'Max', detail: '+450', color: '#3B82F6' }, { text: '–' }] },
    ],
  },
});

export const WithRecap: Story = {
  parameters: source(recapCode),
  decorators: [localizedArgs(recapArgs)],
  args: {
    ...recapArgs(translations.fr),
    entries: [
      { name: 'Zoé', total: 1250, color: '#EF4444' },
      { name: 'Max', total: 2100, color: '#3B82F6' },
      { name: 'Léa', total: 800, color: '#16A34A' },
    ],
  },
};

/** Alone: the rank card stands in for the list, with the round recap showing the points won. */
const soloRankArgs = (t: Translations) => ({
  hero: { emoji: '🧭', title: t.endScreen.ranks[2] },
  recap: {
    title: t.endScreen.recapTitle,
    columns: [t.roundResult.direction, t.roundResult.distance],
    rows: [
      { label: 'Paris', cells: [{ text: '+400' }, { text: '+350' }] },
      { label: 'Tokyo', cells: [{ text: '+300' }, { text: '+280' }] },
    ],
  },
});

export const SoloRank: Story = {
  name: 'Solo with rank',
  parameters: source(soloRankCode),
  decorators: [localizedArgs(soloRankArgs)],
  args: { ...soloRankArgs(translations.fr), entries: [{ name: 'Zoé', total: 1330 }] },
};
