import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '@/components/ui/Button';
import { source } from '@/storybook/source';

import { GameFooter } from './GameFooter';
import withButtonCode from './WithButton.source.md?raw';

const meta = {
  title: 'Common/GameFooter',
  component: GameFooter,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GameFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The panel every game's footer sits in — Silhouette's look (translucent surface, top border);
 * the content is up to the game: here the host's "next round" button. */
export const WithButton: Story = {
  parameters: source(withButtonCode),
  args: { children: <Button label="Manche suivante" onPress={fn()} /> },
};
