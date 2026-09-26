import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_INDICES_BEARING, SAMPLE_INDICES_DISTANCE_KM, SAMPLE_INDICES_PLACE } from '@/helpers/storyFixtures';

import { IndicesClueCard } from './IndicesClueCard';

const meta = {
  title: 'Indices/IndicesClueCard',
  component: IndicesClueCard,
} satisfies Meta<typeof IndicesClueCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Locked: Story = {
  args: { clueId: 'population', label: 'Population', place: SAMPLE_INDICES_PLACE, state: 'locked' },
};

export const PopulationRevealed: Story = {
  args: {
    clueId: 'population',
    label: 'Population',
    place: SAMPLE_INDICES_PLACE,
    populationStage: 2,
    state: 'revealed',
  },
};

export const BearingRevealed: Story = {
  args: {
    bearingDeg: SAMPLE_INDICES_BEARING,
    clueId: 'bearing',
    label: 'Cap',
    place: SAMPLE_INDICES_PLACE,
    state: 'revealed',
  },
};

export const DistanceRevealed: Story = {
  args: {
    bearingDeg: SAMPLE_INDICES_BEARING,
    clueId: 'distance',
    distanceKm: SAMPLE_INDICES_DISTANCE_KM,
    distanceStage: 2,
    label: 'Distance',
    place: SAMPLE_INDICES_PLACE,
    state: 'revealed',
  },
};

export const FlagColorsRevealed: Story = {
  args: { clueId: 'flagColors', flagStage: 3, label: 'Drapeau', place: SAMPLE_INDICES_PLACE, state: 'revealed' },
};

export const LetterRevealed: Story = {
  args: { clueId: 'letter', label: 'Lettres', letterStage: 2, place: SAMPLE_INDICES_PLACE, state: 'revealed' },
};
