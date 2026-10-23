import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';

import { GameCard } from './GameCard';
import { source } from '@/storybook/source';
import compassCode from './Compass.source.md?raw';

const t = translations.fr;

/** Textes de la carte, dans la langue de la barre d'outils. */
const textArgs = (game: 'compass') => (texts: Translations) => ({
  ctaLabel: texts.home.games[game].cta,
  tagline: texts.home.games[game].tagline,
  title: texts.home.games[game].title,
});

const meta = {
  title: 'Common/GameCard',
  component: GameCard,
  decorators: [
    (Story) => (
      <div style={{ width: 420, display: 'flex', flexDirection: 'column' }}>
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
