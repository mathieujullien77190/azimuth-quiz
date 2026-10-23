import { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Button from '@/components/ui/Button';
import { source } from '~sb/source';

import { ReactionOverlay } from './ReactionOverlay';
import type { ReactionOverlayProps } from './types';
import defaultCode from './doc/Default.source.md?raw';

const EMOJIS = ['🤔', '🥰', '😡', '😱'];

/**
 * Nomme (majuscule) pour que rules-of-hooks accepte le `useState`. Un bouton envoie une reaction (nouveau `seq`
 * a chaque fois) : plusieurs d'affilee montent cote a cote.
 */
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
  title: 'Game/ReactionOverlay',
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

/**
 * Reaction recue : l'emoji monte du bas au haut de l'ecran comme une bulle, en oscillant et en fondu, avec le nom
 * de l'envoyeur dessous. Ne capte jamais le toucher.
 */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { reaction: null },
  render: InteractiveDemo,
};
