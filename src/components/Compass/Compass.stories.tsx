import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SAMPLE_PLAYERS } from '@/helpers/storyFixtures';

import { Compass } from './Compass';
import type { CompassProps } from './types';
import { source } from '@/storybook/source';
import guessingCode from './Guessing.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

/** Nomme (majuscule) pour que la regle des hooks autorise le `useState`. */
const InteractiveDemo = (args: CompassProps) => {
  const [bearing, setBearing] = useState(args.needles?.[0]?.bearing ?? 0);
  return (
    <Compass
      {...args}
      needles={[{ bearing, color: SAMPLE_PLAYERS[0].color }]}
      onChange={(value) => {
        args.onChange?.(value);
        setBearing(value);
      }}
    />
  );
};

const meta = {
  title: 'Common/Compass',
  component: Compass,
} satisfies Meta<typeof Compass>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clic ou glisser sur le cadran pour regler le cap ; etat local a la story (`Compass` reste controle). */
export const Guessing: Story = {
  parameters: source(guessingCode),
  args: { needles: [{ bearing: 42, color: SAMPLE_PLAYERS[0].color }], onChange: fn(), size: 140 },
  render: InteractiveDemo,
};

export const Revealed: Story = {
  parameters: source(revealedCode),
  args: {
    needles: [
      { bearing: 110, color: SAMPLE_PLAYERS[0].color },
      { bearing: 200, color: SAMPLE_PLAYERS[1].color },
    ],
    size: 140,
    truthBearing: 80,
  },
};
