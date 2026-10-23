import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DISTANCE_MARKS_KM } from '@/data/game';
import { formatDistance, kmToRatio, ratioToKm } from '@/helpers';
import { SAMPLE_DISTANCE_KM, SAMPLE_MAX_SURFACE_KM } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '~sb/localized';
import { source } from '~sb/source';

import distanceCode from './Distance.source.md?raw';
import percentageCode from './Percentage.source.md?raw';
import { SliderTrack } from './SliderTrack';
import type { SliderTrackProps } from './types';

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. La piste est controlee par son
 * appelant : le ratio vit ici, donc glisser le curseur (ou cliquer la piste) le deplace vraiment et le texte suit
 * (`valueText` derive du ratio) ; chaque changement apparait dans Actions (`onRatioChange` dans `fn()`).
 */
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

/** Pareil, pour une distance derivee du ratio (`valueText` suit le curseur). */
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

/**
 * Primitive de ratio seul : aucune connaissance metier, l'appelant convertit ce qu'il mesure vers/depuis un
 * ratio 0-1. Glisser le curseur ou cliquer la piste.
 */
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

/**
 * Curseur de distance de Compass : echelle logarithmique (`ratioToKm` / `kmToRatio`), les cent premiers
 * kilometres ont autant de place que les dix mille derniers.
 */
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
