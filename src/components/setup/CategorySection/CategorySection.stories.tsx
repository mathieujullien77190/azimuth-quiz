import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CATEGORIES } from '@/games/compass/constants';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import type { Category } from '@/types';

import { CategorySection } from './CategorySection';
import type { CategorySectionProps } from './types';
import { source } from '@/storybook/source';
import compassCode from './Compass.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

const t = translations.fr;

/** Titre et indice « N lieux disponibles », dans la langue de la barre d'outils. */
const categoryText = (available: number) => (texts: Translations) => ({
  title: texts.setup.categoriesTitle,
  hint: texts.setup.categoriesAvailability(available),
});

/**
 * Nomme (majuscule) pour que rules-of-hooks d'eslint accepte le `useState`. Un clic sur une puce l'ajoute ou la
 * retire de `selected` ; `CategorySection` reste controle.
 */
const InteractiveDemo = (args: CategorySectionProps) => {
  const [selected, setSelected] = useState<Category[]>(args.selected);
  return (
    <CategorySection
      {...args}
      onToggle={(id) => {
        args.onToggle(id);
        setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
      }}
      selected={selected}
    />
  );
};

const meta = {
  title: 'Setup/CategorySection',
  component: CategorySection,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: InteractiveDemo,
} satisfies Meta<typeof CategorySection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Pool complet de categories de Compass. */
export const Compass: Story = {
  parameters: source(compassCode),
  decorators: [localizedArgs(categoryText(120))],
  args: {
    ...categoryText(120)(t),
    categories: CATEGORIES,
    selected: ['cities', 'capital', 'mountains'],
    onToggle: fn(),
  },
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  decorators: [localizedArgs(categoryText(120))],
  args: { ...Compass.args, disabled: true } as CategorySectionProps,
};
