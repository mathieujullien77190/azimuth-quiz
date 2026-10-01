import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';
import { source } from '@/storybook/source';

import { Globe3D } from './Globe3D';
import parisNewYorkCode from './ParisNewYork.source.md?raw';
import bareWithGuidesCode from './BareWithGuides.source.md?raw';
import tokyoSydneyCode from './TokyoSydney.source.md?raw';

const meta = {
  title: 'Common/Globe3D',
  component: Globe3D,
} satisfies Meta<typeof Globe3D>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Two answers from Paris: the true one (a circled point, no route) and a guess whose route follows the curve of the ball.
 * Drag the globe to turn it. */
export const ParisNewYork: Story = {
  parameters: source(parisNewYorkCode),
  args: {
    size: 320,
    origin: { latitude: 48.8566, longitude: 2.3522 },
    marks: [
      { bearing: 291.6, distanceKm: 5837, color: SAMPLE_PLAYERS[0].color, isTruth: true },
      { bearing: 270, distanceKm: 5000, color: SAMPLE_PLAYERS[1].color },
    ],
  },
};

/** A long route to the other hemisphere: the globe first shows the middle of the way, the route goes behind it where
 * the Earth curves away. */
export const TokyoSydney: Story = {
  parameters: source(tokyoSydneyCode),
  args: {
    size: 320,
    origin: { latitude: 35.68, longitude: 139.69 },
    marks: [{ bearing: 160, distanceKm: 7800, color: SAMPLE_PLAYERS[2].color }],
  },
};

/** The bare ball with the equator and the Greenwich meridian (dashed): enough to read where the answer is, without the
 * land. This is the first stage of the Clues game's 3D clue. */
export const BareWithGuides: Story = {
  parameters: source(bareWithGuidesCode),
  args: {
    size: 320,
    origin: { latitude: 48.8566, longitude: 2.3522 },
    land: false,
    equator: true,
    greenwich: true,
    marks: [{ bearing: 291.6, distanceKm: 5837, color: SAMPLE_PLAYERS[0].color, isTruth: true }],
  },
};
