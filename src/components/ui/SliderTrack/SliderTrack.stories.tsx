import type { Meta, StoryObj } from '@storybook/react-vite';

import { DISTANCE_MARKS_KM } from '@/games/compass/constants';
import { formatDistance, kmToRatio } from '@/helpers';
import { SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';

import { SliderTrack } from './SliderTrack';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Compass/SliderTrack',
  component: SliderTrack,
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SliderTrack>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The ratio-only primitive `DistanceSlider` wraps: no domain knowledge of its own, everything
 * (marks, label, value text) is converted to/from a plain 0-1 ratio by the caller. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: {
    label: translations.fr.sliders.distance,
    marks: DISTANCE_MARKS_KM.filter((km) => km < SAMPLE_MAX_SURFACE_KM).map((km) => ({
      ratio: kmToRatio(km, SAMPLE_MAX_SURFACE_KM),
      label: formatDistance(km),
    })),
    onRatioChange: () => {},
    ratio: kmToRatio(SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM),
    valueText: formatDistance(SAMPLE_DISTANCE_KM),
  },
};
