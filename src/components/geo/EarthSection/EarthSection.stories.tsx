import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';

import { EarthSection } from './EarthSection';
import { source } from '@/storybook/source';
import surfaceCode from './Surface.source.md?raw';
import withGlobeCode from './WithGlobe.source.md?raw';
import withZoomControlsCode from './WithZoomControls.source.md?raw';

const meta = {
  title: 'Geo/EarthSection',
  component: EarthSection,
} satisfies Meta<typeof EarthSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Zoom continu : recalcule a chaque rendu depuis `marks` via `fitZoom` ; une courte distance suffit a zoomer. */
export const Surface: Story = {
  parameters: source(surfaceCode),
  args: {
    marks: [{ bearing: 60, distanceKm: 3000, color: SAMPLE_PLAYERS[0].color, isTruth: true }],
    size: 160,
  },
};

export const WithZoomControls: Story = {
  parameters: source(withZoomControlsCode),
  args: {
    marks: [{ bearing: 30, distanceKm: 9000, color: SAMPLE_PLAYERS[1].color, isTruth: true }],
    size: 160,
    zoomControls: true,
  },
};

/** Au zoom Terre entiere, une longue reponse se voit sur un globe 3D tournant au doigt : exige `origin`. */
export const WithGlobe: Story = {
  parameters: source(withGlobeCode),
  args: {
    marks: [{ bearing: 261.4, distanceKm: 6079, color: SAMPLE_PLAYERS[0].color, isTruth: true }],
    origin: { latitude: 48.8566, longitude: 2.3522 },
    size: 160,
    zoomControls: true,
  },
};
