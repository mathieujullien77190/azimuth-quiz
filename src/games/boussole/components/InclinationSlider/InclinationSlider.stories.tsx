import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_MAX_STRAIGHT_KM } from '@/helpers/storyFixtures';

import { InclinationSlider } from './InclinationSlider';

const meta = {
  title: 'Boussole/InclinationSlider',
  component: InclinationSlider,
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InclinationSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { distanceKm: 6000, maxKm: SAMPLE_MAX_STRAIGHT_KM, onChange: () => {} },
};
