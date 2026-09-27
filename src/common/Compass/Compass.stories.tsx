import type { Meta, StoryObj } from '@storybook/react-vite';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';

import { Compass } from './Compass';

const meta = {
  title: 'Common/Compass',
  component: Compass,
} satisfies Meta<typeof Compass>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guessing: Story = {
  args: { bearing: 42, color: SAMPLE_PLAYERS[0].color, size: 140 },
};

export const Revealed: Story = {
  args: {
    bearing: 110,
    color: SAMPLE_PLAYERS[0].color,
    extraNeedles: [{ bearing: 200, color: SAMPLE_PLAYERS[1].color }],
    size: 140,
    truthBearing: 80,
  },
};
