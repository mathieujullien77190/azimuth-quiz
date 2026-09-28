import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_CLUE_BEARING, SAMPLE_CLUE_DISTANCE_KM, SAMPLE_CLUE_PLACE } from '@/helpers/storyFixtures';

import { ClueCard } from './ClueCard';
import { source } from '@/storybook/source';
import lockedCode from './Locked.source.md?raw';
import populationRevealedCode from './PopulationRevealed.source.md?raw';
import bearingRevealedCode from './BearingRevealed.source.md?raw';
import distanceRevealedCode from './DistanceRevealed.source.md?raw';
import flagColorsRevealedCode from './FlagColorsRevealed.source.md?raw';
import letterRevealedCode from './LetterRevealed.source.md?raw';

const meta = {
  title: 'Clues/ClueCard',
  component: ClueCard,
} satisfies Meta<typeof ClueCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Locked: Story = {
  parameters: source(lockedCode),
  args: { clueId: 'population', label: 'Population', place: SAMPLE_CLUE_PLACE, state: 'locked' },
};

export const PopulationRevealed: Story = {
  parameters: source(populationRevealedCode),
  args: {
    clueId: 'population',
    label: 'Population',
    place: SAMPLE_CLUE_PLACE,
    populationStage: 2,
    state: 'revealed',
  },
};

export const BearingRevealed: Story = {
  parameters: source(bearingRevealedCode),
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    clueId: 'bearing',
    label: 'Cap',
    place: SAMPLE_CLUE_PLACE,
    state: 'revealed',
  },
};

export const DistanceRevealed: Story = {
  parameters: source(distanceRevealedCode),
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
  parameters: source(flagColorsRevealedCode),
  args: { clueId: 'flagColors', flagStage: 3, label: 'Drapeau', place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};

export const LetterRevealed: Story = {
  parameters: source(letterRevealedCode),
  args: { clueId: 'letter', label: 'Lettres', letterStage: 2, place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};
