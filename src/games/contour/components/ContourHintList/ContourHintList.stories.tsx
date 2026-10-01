import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { hintGroupsView, type HintStep } from '@/games/contour/helpers/hintPlan';
import { source } from '@/storybook/source';

import { ContourHintList } from './ContourHintList';
import midRoundCode from './MidRound.source.md?raw';
import waitingCode from './Waiting.source.md?raw';

/** The steps of a round with every kind of hint, as the players picked them so far: the outline twice, then the
 * first neighbors step. */
const PLAN: HintStep[] = [
  'silhouette1',
  'silhouette2',
  'neighborShapes',
  'silhouette3',
  'neighborFlags',
  'neighborCodes',
  'neighborNames',
  'cityPositions',
  'cityNames',
  'capitalPosition',
  'capitalName',
  'reveal',
];

const meta = {
  title: 'Silhouette/ContourHintList',
  component: ContourHintList,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { groups: hintGroupsView(PLAN, 3), onPick: fn() },
} satisfies Meta<typeof ContourHintList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The turn-holder's view: each group shows how many of its steps are out, and its next step as a button. */
export const MidRound: Story = {
  parameters: source(midRoundCode),
};

/** Everybody else's view: the same list, but nothing can be tapped while it is not their turn. */
export const Waiting: Story = {
  parameters: source(waitingCode),
  args: { disabled: true },
};
