import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DISTANCE_MARKS_KM } from '@/games/compass/constants';
import { formatDistance, kmToRatio, ratioToKm } from '@/helpers';
import { SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import distanceCode from './Distance.source.md?raw';
import percentageCode from './Percentage.source.md?raw';
import { SliderTrack } from './SliderTrack';
import type { SliderTrackProps } from './types';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. The track is
 * controlled by its caller: the ratio lives here, so dragging the thumb (or clicking the track)
 * really moves it and the value text follows (`valueText` is derived from the ratio, not a fixed arg) —
 * each change also shows up in the Actions panel (`onRatioChange` in `fn()`). */
const PercentageDemo = (args: SliderTrackProps) => {
  const [ratio, setRatio] = useState(args.ratio);
  return (
    <SliderTrack
      {...args}
      onRatioChange={(value) => {
        args.onRatioChange(value);
        setRatio(value);
      }}
      ratio={ratio}
      valueText={`${Math.round(ratio * 100)} %`}
    />
  );
};

/** Same, for a distance derived from the ratio (`valueText` follows the thumb). */
const DistanceDemo = (args: SliderTrackProps) => {
  const [ratio, setRatio] = useState(args.ratio);
  const km = ratioToKm(ratio, SAMPLE_MAX_SURFACE_KM);
  return (
    <SliderTrack
      {...args}
      onRatioChange={(value) => {
        args.onRatioChange(value);
        setRatio(value);
      }}
      ratio={ratio}
      valueText={formatDistance(km)}
    />
  );
};

const meta = {
  title: 'UI/SliderTrack',
  component: SliderTrack,
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
  args: { onRatioChange: fn() },
} satisfies Meta<typeof SliderTrack>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The ratio-only primitive: no domain knowledge of its own, the caller converts whatever it
 * measures to and from a plain 0-1 ratio. Drag the thumb or click the track. */
export const Percentage: Story = {
  parameters: source(percentageCode),
  args: {
    label: 'Volume',
    marks: [
      { ratio: 0, label: '0 %' },
      { ratio: 0.5, label: '50 %' },
      { ratio: 1, label: '100 %' },
    ],
    ratio: 0.3,
    valueText: '30 %',
  },
  render: PercentageDemo,
};

/** Compass' distance slider: a logarithmic distance scale (`ratioToKm` /
 * `kmToRatio`), so the first hundred kilometres get as much room as the last ten thousand. */
export const Distance: Story = {
  parameters: source(distanceCode),
  decorators: [localizedArgs((t) => ({ label: t.sliders.distance }))],
  args: {
    label: translations.fr.sliders.distance,
    marks: DISTANCE_MARKS_KM.filter((km) => km < SAMPLE_MAX_SURFACE_KM).map((km) => ({
      ratio: kmToRatio(km, SAMPLE_MAX_SURFACE_KM),
      label: formatDistance(km),
    })),
    ratio: kmToRatio(SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM),
    valueText: formatDistance(SAMPLE_DISTANCE_KM),
  },
  render: DistanceDemo,
};
