import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { translations } from '@/i18n/translations';

import { OptionsSection } from './OptionsSection';
import type { OptionsSectionProps } from './types';
import { source } from '@/storybook/source';
import withoutGpsCode from './WithoutGps.source.md?raw';
import withGpsCode from './WithGps.source.md?raw';
import hiddenOptionCode from './HiddenOption.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

const t = translations.fr;

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. Every toggle
 * (options + GPS) and the custom origin are wired to local state so the whole block is clickable;
 * `OptionsSection` itself stays fully controlled by its caller. */
const InteractiveDemo = (args: OptionsSectionProps) => {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(args.options.map((option) => [option.id, option.value])),
  );
  const [gps, setGps] = useState(args.gps);

  return (
    <OptionsSection
      {...args}
      gps={
        gps && {
          ...gps,
          onChangeCustomOrigin: (patch) => {
            args.gps?.onChangeCustomOrigin(patch);
            setGps(
              (current) =>
                current && {
                  ...current,
                  latitude: patch.customLatitude ?? current.latitude,
                  longitude: patch.customLongitude ?? current.longitude,
                },
            );
          },
          onToggleUseGps: (value) => {
            args.gps?.onToggleUseGps(value);
            setGps((current) => current && { ...current, useGps: value });
          },
        }
      }
      options={args.options.map((option) => ({
        ...option,
        onChange: (value) => {
          option.onChange(value);
          setValues((current) => ({ ...current, [option.id]: value }));
        },
        value: values[option.id],
      }))}
    />
  );
};

const meta = {
  title: 'Common/Setup/OptionsSection',
  component: OptionsSection,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: InteractiveDemo,
} satisfies Meta<typeof OptionsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

const gpsOption = {
  title: t.setup.toggles.useGps.label,
  description: t.setup.toggles.useGps.description,
  useGps: true,
  onToggleUseGps: fn(),
  latitude: 48.8566,
  longitude: 2.3522,
  onChangeCustomOrigin: fn(),
};

/** Clues' own block: one plain option, no GPS. */
export const WithoutGps: Story = {
  parameters: source(withoutGpsCode),
  args: {
    title: t.cluesSetup.optionsTitle,
    options: [
      {
        id: 'startWithFirstLetter',
        title: t.cluesSetup.toggles.startWithFirstLetter.label,
        description: t.cluesSetup.toggles.startWithFirstLetter.description,
        value: true,
        onChange: fn(),
      },
    ],
  },
};

/** Compass' own block: several options plus the GPS one — switch "Utiliser ma position" off to
 * reveal the custom latitude/longitude fields. */
export const WithGps: Story = {
  parameters: source(withGpsCode),
  args: {
    title: t.setup.optionsTitle,
    options: [
      {
        id: 'liveCompass',
        ...t.setup.toggles.liveCompass,
        title: t.setup.toggles.liveCompass.label,
        value: false,
        onChange: fn(),
      },
      {
        id: 'showCountry',
        ...t.setup.toggles.showCountry,
        title: t.setup.toggles.showCountry.label,
        value: true,
        onChange: fn(),
      },
    ],
    gps: gpsOption,
  },
};

/** `hidden` skips an option without touching the array (here "Cacher les réponses des autres",
 * which Compass only shows with 2+ players). */
export const HiddenOption: Story = {
  parameters: source(hiddenOptionCode),
  args: {
    title: t.setup.optionsTitle,
    options: [
      {
        id: 'showCountry',
        ...t.setup.toggles.showCountry,
        title: t.setup.toggles.showCountry.label,
        value: true,
        onChange: fn(),
      },
      {
        id: 'hideOtherAnswers',
        ...t.setup.toggles.hideOtherAnswers,
        title: t.setup.toggles.hideOtherAnswers.label,
        value: false,
        onChange: fn(),
        hidden: true,
      },
    ],
    gps: { ...gpsOption, useGps: false },
  },
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { ...WithGps.args, disabled: true } as OptionsSectionProps,
};
