import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import { ContourGuessBar } from './ContourGuessBar';
import emptyCode from './Empty.source.md?raw';
import type { ContourGuessBarProps } from './types';
import afterAMissCode from './AfterAMiss.source.md?raw';

/** Named (capitalized) so eslint's rules-of-hooks recognizes it as a component and allows the
 * `useState` below — an inline arrow assigned to a story's `render` doesn't qualify. Only the text
 * field is wired to local state, so typing works; "Valider" is disabled while it's empty. */
const InteractiveDemo = (args: ContourGuessBarProps) => {
  const [guessText, setGuessText] = useState(args.guessText);
  return <ContourGuessBar {...args} guessText={guessText} onChangeGuessText={setGuessText} />;
};

const meta = {
  title: 'Silhouette/ContourGuessBar',
  component: ContourGuessBar,
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { guessText: '', onChangeGuessText: fn(), onSubmit: fn() },
  render: InteractiveDemo,
} satisfies Meta<typeof ContourGuessBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  parameters: source(emptyCode),
};

/** The turn-holder guessed wrong: the penalty banner sits above the input, which stays open. */
export const AfterAMiss: Story = {
  parameters: source(afterAMissCode),
  decorators: [localizedArgs((t) => ({ wrongText: t.contourGame.wrongGuess('Zoé') }))],
  args: { guessText: 'Espagn', wrongText: translations.fr.contourGame.wrongGuess('Zoé') },
};
