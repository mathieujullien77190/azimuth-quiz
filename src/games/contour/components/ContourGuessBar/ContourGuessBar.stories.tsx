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
import notYourTurnCode from './NotYourTurn.source.md?raw';
import alreadyGuessedCode from './AlreadyGuessed.source.md?raw';

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
  args: {
    label: translations.fr.contourGame.guessLabel,
    guessText: '',
    onChangeGuessText: fn(),
    onSubmit: fn(),
  },
  render: InteractiveDemo,
} satisfies Meta<typeof ContourGuessBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  parameters: source(emptyCode),
  decorators: [
    localizedArgs((t) => ({ label: t.contourGame.guessLabel })),
  ],
};

/** Not the turn-holder: the field is open to type a country, but "Valider" stays greyed out. */
export const NotYourTurn: Story = {
  parameters: source(notYourTurnCode),
  args: { guessText: 'Espagn', canSubmit: false },
};

/** The turn-holder guessed wrong: the penalty banner sits above the input, which stays open. */
export const AfterAMiss: Story = {
  parameters: source(afterAMissCode),
  decorators: [
    localizedArgs((t) => ({
      label: t.contourGame.guessLabel,
      wrongText: t.contourGame.wrongGuess('Zoé', '5'),
    })),
  ],
  args: { guessText: 'Espagn', wrongText: translations.fr.contourGame.wrongGuess('Zoé', '5') },
};

/** One guess per turn: the turn-holder already missed, so the field and "Valider" are hidden and only the line says what is left to do. */
export const AlreadyGuessed: Story = {
  parameters: source(alreadyGuessedCode),
  decorators: [
    localizedArgs((t) => ({
      label: t.contourGame.guessLabel,
      lockedText: t.game.alreadyGuessed,
    })),
  ],
  args: { guessText: 'Espagn', canSubmit: false, lockedText: translations.fr.game.alreadyGuessed },
};
