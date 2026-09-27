import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM } from '@/helpers/storyFixtures';

import { DistanceSlider } from './DistanceSlider';

const meta = {
  title: 'Boussole/DistanceSlider',
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
  args: { maxKm: SAMPLE_MAX_SURFACE_KM, onChange: () => {}, valueKm: SAMPLE_DISTANCE_KM },
};
