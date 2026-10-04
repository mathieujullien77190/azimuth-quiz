import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  SAMPLE_CLUE_BEARING,
  SAMPLE_CLUE_DISTANCE_KM,
  SAMPLE_CLUE_PLACE,
  SAMPLE_CLUE_PLACE_HYPHEN,
  SAMPLE_CLUE_PLACE_SPACE,
} from '@/helpers/storyFixtures';

import { ClueCard } from './ClueCard';
import { source } from '@/storybook/source';
import lockedCode from './Locked.source.md?raw';
import populationRevealedCode from './PopulationRevealed.source.md?raw';
import bearingRevealedCode from './BearingRevealed.source.md?raw';
import distanceRevealedCode from './DistanceRevealed.source.md?raw';
import globeRevealedCode from './GlobeRevealed.source.md?raw';
import globeLandRevealedCode from './GlobeLandRevealed.source.md?raw';
import flagColorsRevealedCode from './FlagColorsRevealed.source.md?raw';
import letterRevealedSpaceCode from './LetterRevealedSpace.source.md?raw';
import letterRevealedHyphenCode from './LetterRevealedHyphen.source.md?raw';
import personalityRevealedCode from './PersonalityRevealed.source.md?raw';

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

const PARIS = { latitude: 48.8566, longitude: 2.3522 };

/** First stage: the starting point and the place on the bare ball, with the equator and the Greenwich meridian. */
export const GlobeRevealed: Story = {
  parameters: source(globeRevealedCode),
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    clueId: 'globe',
    distanceKm: SAMPLE_CLUE_DISTANCE_KM,
    globeStage: 1,
    label: 'Globe 3D',
    origin: PARIS,
    place: SAMPLE_CLUE_PLACE,
    state: 'revealed',
  },
};

/** Second stage: the world's land appears on the globe. */
export const GlobeLandRevealed: Story = {
  parameters: source(globeLandRevealedCode),
  args: { ...GlobeRevealed.args, globeStage: 2 },
};

export const FlagColorsRevealed: Story = {
  parameters: source(flagColorsRevealedCode),
  args: { clueId: 'flagColors', flagStage: 3, label: 'Drapeau', place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};

/** A multi-word name ("New York"): the letter clue splits it into one skeleton group per word. */
export const LetterRevealedSpace: Story = {
  parameters: source(letterRevealedSpaceCode),
  args: { clueId: 'letter', label: 'Lettres', letterStage: 2, place: SAMPLE_CLUE_PLACE_SPACE, state: 'revealed' },
};

/** A hyphenated name ("Saint-Malo"): the hyphen is drawn in place, outside any letter slot, and
 * is never itself a slot to fill. */
export const LetterRevealedHyphen: Story = {
  parameters: source(letterRevealedHyphenCode),
  args: { clueId: 'letter', label: 'Lettres', letterStage: 2, place: SAMPLE_CLUE_PLACE_HYPHEN, state: 'revealed' },
};

/** A real person tied to the place (here Tokyo), curated in `scripts/personalityCuration.json` —
 * a place with none curated never offers this card at all (see `cluesFor`). */
export const PersonalityRevealed: Story = {
  parameters: source(personalityRevealedCode),
  args: { clueId: 'personality', label: 'Personnalité', place: SAMPLE_CLUE_PLACE, state: 'revealed' },
};
