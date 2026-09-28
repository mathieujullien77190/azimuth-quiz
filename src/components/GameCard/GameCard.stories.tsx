import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';

import { GameCard } from './GameCard';
import { source } from '@/storybook/source';
import compassCode from './Compass.source.md?raw';
import cluesCode from './Clues.source.md?raw';
import contourCode from './Contour.source.md?raw';

const t = translations.fr;

/** The card's texts, in the toolbar's language. */
const textArgs = (game: 'compass' | 'clues' | 'contour') => (texts: Translations) => ({
  ctaLabel: texts.home.games[game].cta,
  tagline: texts.home.games[game].tagline,
  title: texts.home.games[game].title,
});

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
  parameters: source(compassCode),
  decorators: [localizedArgs(textArgs('compass'))],
  args: {
    ...textArgs('compass')(t),
    icon: '🧭',
    maxPlayers: 10,
    onPress: () => {},
  },
};

export const Clues: Story = {
  parameters: source(cluesCode),
  decorators: [localizedArgs(textArgs('clues'))],
  args: {
    ...textArgs('clues')(t),
    icon: '🧩',
    maxPlayers: 10,
    onPress: () => {},
  },
};

export const Contour: Story = {
  parameters: source(contourCode),
  decorators: [localizedArgs(textArgs('contour'))],
  name: 'Silhouette',
  args: {
    ...textArgs('contour')(t),
    icon: '🗺️',
    maxPlayers: 10,
    onPress: () => {},
  },
};
