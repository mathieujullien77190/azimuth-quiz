import type { Meta, StoryObj } from '@storybook/react-vite';

import { flagEmoji, countryName } from '@/constants/places/countries';
import {
  SAMPLE_CONTOUR_BOARD_SIZE,
  SAMPLE_CONTOUR_CENTER_POSITION,
  SAMPLE_CONTOUR_COUNTRY,
  SAMPLE_CONTOUR_NEIGHBORS,
  SAMPLE_CONTOUR_OUTLINE,
} from '@/helpers/storyFixtures';

import { ContourBoard } from './ContourBoard';

const meta = {
  title: 'Silhouette/ContourBoard',
  component: ContourBoard,
} satisfies Meta<typeof ContourBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** France's real curated outline/neighbors/centerLabel (hand-adjusted, not auto-generated — see
 * CLAUDE.md's Silhouette section), at every hint tier revealed at once: neighbor flags, the
 * target's own flag, and every neighbor name stacked under its icon. */
export const AllHintsRevealed: Story = {
  args: {
    height: SAMPLE_CONTOUR_BOARD_SIZE.height,
    hintLabels: [
      ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
        position,
        text: flagEmoji(neighbor.code),
        icon: true,
      })),
      ...SAMPLE_CONTOUR_NEIGHBORS.map(({ neighbor, position }) => ({
        position,
        text: countryName(neighbor.code, 'fr'),
      })),
      { position: SAMPLE_CONTOUR_CENTER_POSITION, text: flagEmoji(SAMPLE_CONTOUR_COUNTRY.code), icon: true },
    ],
    outline: SAMPLE_CONTOUR_OUTLINE,
    width: SAMPLE_CONTOUR_BOARD_SIZE.width,
  },
};
