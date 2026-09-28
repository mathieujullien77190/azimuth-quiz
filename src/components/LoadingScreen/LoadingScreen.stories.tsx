import type { Meta, StoryObj } from '@storybook/react-vite';

import { source } from '@/storybook/source';

import defaultCode from './Default.source.md?raw';
import { LoadingScreen } from './LoadingScreen';

const meta = {
  title: 'Common/LoadingScreen',
  component: LoadingScreen,
  // A full-screen `SafeAreaView` (flex: 1) — needs a sized flex ancestor to preview as a box.
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 200, position: 'relative', width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoadingScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "Préparation de la partie…" — between "Lancer la partie" and the game screen taking over, and
 * while an online game screen waits for its first room snapshot. */
export const Default: Story = {
  parameters: source(defaultCode),
};
