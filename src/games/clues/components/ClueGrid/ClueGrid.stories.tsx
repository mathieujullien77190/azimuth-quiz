import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import {
  SAMPLE_CLUE_BEARING,
  SAMPLE_CLUE_DISTANCE_KM,
  SAMPLE_CLUE_PLACE,
  SAMPLE_CLUE_PLACE_FR,
} from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { ClueGrid } from './ClueGrid';
import frenchCityCode from './FrenchCity.source.md?raw';
import myTurnCode from './MyTurn.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';
import roundOverCode from './RoundOver.source.md?raw';

const meta = {
  title: 'Clues/ClueGrid',
  component: ClueGrid,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    bearingDeg: SAMPLE_CLUE_BEARING,
    distanceKm: SAMPLE_CLUE_DISTANCE_KM,
    place: SAMPLE_CLUE_PLACE,
    roundOver: false,
  },
} satisfies Meta<typeof ClueGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Tour de cet appareil : les cartes non devoilees sont cliquables (chaque clic passe aussi la main). */
export const MyTurn: Story = {
  parameters: source(myTurnCode),
  args: { onPickClue: fn(), revealedClueIds: ['population', 'letter'] },
};

/** Tour d'un autre (ou joiner spectateur) : `onPickClue` absent, cartes en lecture seule. */
export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { revealedClueIds: ['population', 'bearing', 'letter'] },
};

/** Manche finie : tout est montre, quoi qu'il ait ete choisi. */
export const RoundOver: Story = {
  parameters: source(roundOverCode),
  args: { revealedClueIds: ['population'], roundOver: true },
};

/** Ville francaise (`citiesFr`) : moins de cartes, les indices qui ne varient pas en France ne sont pas offerts (voir `cluesFor`). */
export const FrenchCity: Story = {
  parameters: source(frenchCityCode),
  args: { onPickClue: fn(), place: SAMPLE_CLUE_PLACE_FR, revealedClueIds: ['population'] },
};
