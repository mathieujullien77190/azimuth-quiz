import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';
import { THEMES } from '@/themes';

import { Legend } from './Legend';

const meta = {
  title: 'Common/Legend',
  component: Legend,
} satisfies Meta<typeof Legend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlayersAndTruth: Story = {
  args: {
    items: [
      ...SAMPLE_PLAYERS.map((player) => ({ label: player.name, color: player.color })),
      { label: translations.fr.game.reality, color: THEMES.night.colors.truth, ring: true },
    ],
  },
};
