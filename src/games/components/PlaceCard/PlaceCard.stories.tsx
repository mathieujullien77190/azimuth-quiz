import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLACE_REVEALED } from '@/helpers/storyFixtures';

import type { Place } from '@/types';

import { PlaceCard } from './PlaceCard';
import { source } from '@/storybook/source';
import guessingCode from './Guessing.source.md?raw';
import longNameCode from './LongName.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

/** Nom long : il s'affiche en entier, sur plusieurs lignes, sans points de suspension. */
const LONG_NAME_PLACE: Place = {
  name: 'Cap de Bonne-Espérance',
  coordinates: { latitude: -34.357, longitude: 18.474 },
  code: 'ZA',
  country: { fr: 'Afrique du Sud', en: 'South Africa' },
  category: 'landmarks',
  difficulty: 'intermediate',
};

const meta = {
  title: 'Game/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guessing: Story = {
  parameters: source(guessingCode),
  args: { place: SAMPLE_PLACE_REVEALED, showCountry: false },
};

export const Revealed: Story = {
  parameters: source(revealedCode),
  args: { description: SAMPLE_PLACE_REVEALED.description, place: SAMPLE_PLACE_REVEALED, showCountry: true },
};

export const LongName: Story = {
  name: 'Long name',
  parameters: source(longNameCode),
  args: { place: LONG_NAME_PLACE, showCountry: true },
};
