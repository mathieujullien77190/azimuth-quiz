import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM } from '@/helpers/storyFixtures';

import { DistanceSlider } from './DistanceSlider';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

const meta = {
  title: 'Compass/DistanceSlider',
  component: DistanceSlider,
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DistanceSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: source(defaultCode),
  args: { maxKm: SAMPLE_MAX_SURFACE_KM, onChange: () => {}, valueKm: SAMPLE_DISTANCE_KM },
};
