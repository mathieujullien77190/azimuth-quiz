import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '@/storybook/source';
import type { ContourHintCategory } from '@/types';

import { HintCategorySection } from './HintCategorySection';
import allCode from './AllHints.source.md?raw';
import readOnlyCode from './ReadOnly.source.md?raw';
import type { HintCategorySectionProps } from './types';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below. Clicking a chip toggles it, the last one selected stays (as in the real setup). */
const InteractiveDemo = (args: HintCategorySectionProps) => {
  const [selected, setSelected] = useState<ContourHintCategory[]>(args.selected);
  return (
    <HintCategorySection
      {...args}
      onToggle={(id) => {
        args.onToggle(id);
        setSelected((current) =>
          current.includes(id) ? (current.length > 1 ? current.filter((entry) => entry !== id) : current) : [...current, id],
        );
      }}
      selected={selected}
    />
  );
};

const meta = {
  title: 'Silhouette/HintCategorySection',
  component: HintCategorySection,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: InteractiveDemo,
} satisfies Meta<typeof HintCategorySection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default: every kind of hint is in play. */
export const AllHints: Story = {
  parameters: source(allCode),
  args: { selected: ['silhouette', 'neighbors', 'cities', 'capital'], onToggle: fn() },
};

/** A joiner sees the host's choice and cannot change it. */
export const ReadOnly: Story = {
  parameters: source(readOnlyCode),
  args: { selected: ['silhouette', 'capital'], onToggle: fn(), disabled: true },
};
