import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLACE_GUESSING, SAMPLE_PLACE_REVEALED } from '@/helpers/storyFixtures';

import { PlaceCard } from './PlaceCard';

const meta = {
  title: 'Compass/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guessing: Story = {
  args: { place: SAMPLE_PLACE_GUESSING, showCountry: false },
};

export const Revealed: Story = {
  args: { description: SAMPLE_PLACE_REVEALED.description, place: SAMPLE_PLACE_REVEALED, showCountry: true },
};
