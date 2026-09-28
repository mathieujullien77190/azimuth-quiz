import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLACE_GUESSING, SAMPLE_PLACE_REVEALED } from '@/helpers/storyFixtures';

import { PlaceCard } from './PlaceCard';
import { source } from '@/storybook/source';
import guessingCode from './Guessing.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

const meta = {
  title: 'Compass/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guessing: Story = {
  parameters: source(guessingCode),
  args: { place: SAMPLE_PLACE_GUESSING, showCountry: false },
};

export const Revealed: Story = {
  parameters: source(revealedCode),
  args: { description: SAMPLE_PLACE_REVEALED.description, place: SAMPLE_PLACE_REVEALED, showCountry: true },
};
