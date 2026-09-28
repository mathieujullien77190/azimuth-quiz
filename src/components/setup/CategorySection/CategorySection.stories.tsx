import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CATEGORIES } from '@/games/compass/constants';
import { CLUE_CATEGORIES } from '@/games/clues/constants';
import { translations } from '@/i18n/translations';
import type { Category } from '@/types';

import { CategorySection } from './CategorySection';
import type { CategorySectionProps } from './types';
import { source } from '@/storybook/source';
import compassCode from './Compass.source.md?raw';
import cluesCode from './Clues.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';

const t = translations.fr;

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
  title: 'Common/Setup/CategorySection',
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
  args: {
    title: t.setup.categoriesTitle,
    hint: t.setup.categoriesAvailability(120),
    categories: CATEGORIES,
    selected: ['cities', 'capital', 'mountains'],
    onToggle: fn(),
  },
};

/** Clues' own subset: city-only categories. */
export const Clues: Story = {
  parameters: source(cluesCode),
  args: {
    title: t.setup.categoriesTitle,
    hint: t.setup.categoriesAvailability(42),
    categories: CLUE_CATEGORIES,
    selected: ['cities'],
    onToggle: fn(),
  },
};

export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { ...Compass.args, disabled: true } as CategorySectionProps,
};
