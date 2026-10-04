import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from '@/components/ui/Button';
import { source } from '@/storybook/source';

import { ReactionOverlay } from './ReactionOverlay';
import type { ReactionOverlayProps } from './types';
import defaultCode from './Default.source.md?raw';

const EMOJIS = ['🤔', '🥰', '😡', '😱'];

/** Named (capitalized) so eslint's rules-of-hooks allows the `useState`. A button sends a reaction (a new `seq` each time):
 * several in a row rise side by side, each on its own course. */
const InteractiveDemo = () => {
  const [reaction, setReaction] = useState<ReactionOverlayProps['reaction']>(null);
  return (
    <View style={{ height: 560, justifyContent: 'flex-end', position: 'relative' }}>
      <Button
        label="Envoyer une réaction"
        onPress={() => {
          const seq = (reaction?.seq ?? 0) + 1;
          setReaction({ emoji: EMOJIS[seq % EMOJIS.length], name: 'Zoé', seq });
        }}
      />
      <ReactionOverlay reaction={reaction} />
    </View>
  );
};

const meta = {
  title: 'Common/ReactionOverlay',
  component: ReactionOverlay,
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReactionOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A received reaction: the emoji rises from the bottom of the screen (above the footer) to the top like a bubble in
 * water, swaying a few pixels, fading in then out, its sender's name under it. Never catches a touch. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { reaction: null },
  render: InteractiveDemo,
};
