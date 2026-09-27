import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_CLUE_BEARING, SAMPLE_CLUE_DISTANCE_KM, SAMPLE_CLUE_PLACE } from '@/helpers/storyFixtures';

import { ClueCard } from './ClueCard';

const meta = {
  title: 'Clues/ClueCard',
  component: ClueCard,
} satisfies Meta<typeof ClueCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Locked: Story = {
  args: { clueId: 'population', label: 'Population', place: SAMPLE_CLUE_PLACE, state: 'locked' },
};

export const PopulationRevealed: Story = {
  args: {
    clueId: 'population',
    label: 'Population',
    place: SAMPLE_CLUE_PLACE,
    populationStage: 2,
    state: 'revealed',
  },
};

export const BearingRevealed: Story = {
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    clueId: 'bearing',
    label: 'Cap',
    place: SAMPLE_CLUE_PLACE,
    state: 'revealed',
  },
};

export const DistanceRevealed: Story = {
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    clueId: 'distance',
    distanceKm: SAMPLE_CLUE_DISTANCE_KM,
    distanceStage: 2,
    label: 'Distance',
    place: SAMPLE_CLUE_PLACE,
    state: 'revealed',
  },
};

export const FlagColorsRevealed: Story = {
  args: { clueId: 'flagColors', flagStage: 3, label: 'Drapeau', place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};

export const LetterRevealed: Story = {
  args: { clueId: 'letter', label: 'Lettres', letterStage: 2, place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};
