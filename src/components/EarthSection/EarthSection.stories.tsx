import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';

import { EarthSection } from './EarthSection';

const meta = {
  title: 'Common/EarthSection',
  component: EarthSection,
} satisfies Meta<typeof EarthSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Continuous zoom: recomputed every render from the current `marks` via `fitZoom` — a short
 * distance alone already zooms in without touching `zoomControls`. */
export const Surface: Story = {
  args: {
    marks: [{ bearing: 60, distanceKm: 3000, color: SAMPLE_PLAYERS[0].color, isTruth: true }],
    size: 160,
  },
};

export const WithZoomControls: Story = {
  args: {
    marks: [{ bearing: 30, distanceKm: 9000, color: SAMPLE_PLAYERS[1].color, isTruth: true }],
    size: 160,
    zoomControls: true,
  },
};
