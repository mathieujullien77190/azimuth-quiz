import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '@/components/ui/Button';

import { DifficultyFeedbackOverlay } from './DifficultyFeedbackOverlay';
import type { DifficultyFeedbackOverlayProps } from './types';
import { source } from '@/storybook/source';
import defaultCode from './Default.source.md?raw';

/** Named (capitalized) so the rules of hooks allow the `useState`; mocks the game screen the question sits on. */
const InteractiveDemo = (args: DifficultyFeedbackOverlayProps) => {
  const [question, setQuestion] = useState(args.question);
  return (
    <View style={{ alignItems: 'center', gap: 16, height: 400, justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Ecran de jeu (derriere la question)</Text>
      <Button label="Poser la question" onPress={() => setQuestion(args.question)} />
      <DifficultyFeedbackOverlay
        {...args}
        onChoose={(difficulty) => {
          args.onChoose(difficulty);
          setQuestion(null);
        }}
        onDismiss={() => {
          args.onDismiss();
          setQuestion(null);
        }}
        question={question}
      />
    </View>
  );
};

const meta = {
  title: 'Common/DifficultyFeedbackOverlay',
  component: DifficultyFeedbackOverlay,
} satisfies Meta<typeof DifficultyFeedbackOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The dev mode's question after a round: three answers; a tap beside them closes it without a word. */
export const Default: Story = {
  parameters: source(defaultCode),
  args: { question: 'Le lieu Paris était-il…', onChoose: fn(), onDismiss: fn() },
  render: (args) => <InteractiveDemo {...args} />,
};
