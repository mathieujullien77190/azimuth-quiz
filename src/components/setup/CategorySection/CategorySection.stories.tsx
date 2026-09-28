import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CATEGORIES } from '@/games/compass/constants';
import { CLUE_CATEGORIES } from '@/games/clues/constants';
import type { Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import type { Category } from '@/types';

import { CategorySection } from './CategorySection';
import type { CategorySectionProps } from './types';
import { source } from '@/storybook/source';
import compassCode from './Compass.source.md?raw';
import cluesCode from './Clues.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

const t = translations.fr;

/** Title and "N places available" hint, in the toolbar's language. */
const categoryText = (available: number) => (texts: Translations) => ({
  title: texts.setup.categoriesTitle,
  hint: texts.setup.categoriesAvailability(available),
});

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. Clicking a
 * chip toggles it in/out of `selected`; `CategorySection` itself stays fully controlled. */
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

/** Compass' full pool of categories. */
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

/** Clues' own subset: city-only categories. */
export const Clues: Story = {
  parameters: source(cluesCode),
  decorators: [localizedArgs(categoryText(42))],
  args: {
    ...categoryText(42)(t),
    categories: CLUE_CATEGORIES,
    selected: ['cities'],
    onToggle: fn(),
  },
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  decorators: [localizedArgs(categoryText(120))],
  args: { ...Compass.args, disabled: true } as CategorySectionProps,
};
