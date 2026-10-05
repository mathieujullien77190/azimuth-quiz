import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { source } from '@/storybook/source';

import { ContourQuadrantMask } from './ContourQuadrantMask';
import defaultCode from './Default.source.md?raw';
import flagCode from './FlagBehindCell.source.md?raw';
import spectatorCode from './Spectator.source.md?raw';

const meta = {
  title: 'Silhouette/ContourQuadrantMask',
  component: ContourQuadrantMask,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 320, height: 220, background: '#2a6' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    width: 320,
    height: 220,
    hidden: [1, 2, 3],
    canReveal: true,
    costLabel: '−61 pts',
    labelFor: (index: number) => `Dévoiler le carré ${index + 1}`,
    onReveal: fn(),
  },
} satisfies Meta<typeof ContourQuadrantMask>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The turn-holder's view: three cells hidden, each one a button that says what opening it costs. */
export const Default: Story = {
  parameters: source(defaultCode),
};

/** A neighbor's flag behind a hidden cell: an accent rectangle (50 % opacity) marks its place above the cell. */
export const FlagBehindCell: Story = {
  parameters: source(flagCode),
  args: { flagBoxes: [{ x: 230, y: 30, width: 29, height: 20 }] },
};

/** Everybody else's view: the same cells hidden, as plain locks. */
export const Spectator: Story = {
  parameters: source(spectatorCode),
  args: { canReveal: false },
};
