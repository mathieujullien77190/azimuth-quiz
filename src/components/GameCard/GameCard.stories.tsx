import type { Meta, StoryObj } from '@storybook/react-vite';

import { translations } from '@/i18n/translations';

import { GameCard } from './GameCard';

const t = translations.fr;

const meta = {
  title: 'Common/GameCard',
  component: GameCard,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Compass: Story = {
  args: {
    ctaLabel: t.home.games.compass.cta,
    icon: '🧭',
    maxPlayers: 10,
    onPress: () => {},
    tagline: t.home.games.compass.tagline,
    title: t.home.games.compass.title,
  },
};

export const Clues: Story = {
  args: {
    ctaLabel: t.home.games.clues.cta,
    icon: '🧩',
    maxPlayers: 6,
    onPress: () => {},
    tagline: t.home.games.clues.tagline,
    title: t.home.games.clues.title,
  },
};

export const Contour: Story = {
  name: 'Silhouette',
  args: {
    ctaLabel: t.home.games.contour.cta,
    icon: '🗺️',
    maxPlayers: 6,
    onPress: () => {},
    tagline: t.home.games.contour.tagline,
    title: t.home.games.contour.title,
  },
};
