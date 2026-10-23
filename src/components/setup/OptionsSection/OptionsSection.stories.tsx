import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';

import { OptionsSection } from './OptionsSection';
import type { OptionsSectionProps } from './types';
import { source } from '@/storybook/source';
import withGpsCode from './WithGps.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

const t = translations.fr;

/** Titre/description de chaque option et du bloc GPS, par id, dans la langue de la barre d'outils. */
const optionTexts = (texts: Translations): Record<string, { title: string; description?: string }> => ({
  showCountry: {
    title: texts.setup.toggles.showCountry.label,
    description: texts.setup.toggles.showCountry.description,
  },
});

/** Retraduit le titre d'une story, ses options et son bloc GPS, en gardant les handlers. */
const localizedTexts =
  (title: (texts: Translations) => string) => (texts: Translations, args: Record<string, unknown>) => {
    const options = (args.options as OptionsSectionProps['options']).map((option) => ({
      ...option,
      ...optionTexts(texts)[option.id],
    }));
    const gps = args.gps as OptionsSectionProps['gps'];
    return {
      title: title(texts),
      options,
      gps: {
        ...gps,
        title: texts.setup.toggles.useGps.label,
        description: texts.setup.toggles.useGps.description,
      },
    };
  };
const compassOptionsTitle = (texts: Translations) => texts.setup.optionsTitle;

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. Options, GPS et origine perso sont
 * branches sur un state local pour tout cliquer ; `OptionsSection` reste controle par son appelant.
 */
const InteractiveDemo = (args: OptionsSectionProps) => {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(args.options.map((option) => [option.id, option.value])),
  );
  const [gpsValues, setGpsValues] = useState({
    useGps: args.gps.useGps,
    latitude: args.gps.latitude,
    longitude: args.gps.longitude,
  });

  return (
    <OptionsSection
      {...args}
      gps={{
        ...args.gps,
        ...gpsValues,
        onChangeCustomOrigin: (patch) => {
          args.gps.onChangeCustomOrigin(patch);
          setGpsValues((current) => ({
            ...current,
            latitude: patch.customLatitude ?? current.latitude,
            longitude: patch.customLongitude ?? current.longitude,
          }));
        },
        onToggleUseGps: (value) => {
          args.gps.onToggleUseGps(value);
          setGpsValues((current) => ({ ...current, useGps: value }));
        },
      }}
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
  title: 'Setup/OptionsSection',
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

/**
 * Bloc propre a Compass : plusieurs options plus le GPS. Desactiver « Utiliser ma position » revele les champs
 * latitude/longitude perso.
 */
export const WithGps: Story = {
  parameters: source(withGpsCode),
  decorators: [localizedArgs(localizedTexts(compassOptionsTitle))],
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
    ],
    gps: gpsOption,
  },
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  decorators: [localizedArgs(localizedTexts(compassOptionsTitle))],
  args: { ...WithGps.args, disabled: true } as OptionsSectionProps,
};
