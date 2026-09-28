import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import { SAMPLE_CONTOUR_COUNTRY } from '@/helpers/storyFixtures';
import { translations } from '@/i18n/translations';
import { source } from '@/storybook/source';

import ContourGuessBar from '../ContourGuessBar';
import { buildHintLabels, projectRound } from '../../helpers/roundBoard';
import { ContourFullBleedScreen } from './ContourFullBleedScreen';
import guessingCode from './Guessing.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

const t = translations.fr;

// The screen fills its safe area — a sized flex box stands in for the phone. The board is fit to a
// fixed box here; in the game, `useRoundBoard` measures the real one.
const board = projectRound(SAMPLE_CONTOUR_COUNTRY, 380, 300);

const meta = {
  title: 'Silhouette/ContourFullBleedScreen',
  component: ContourFullBleedScreen,
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: 560, width: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    board,
    roundKey: 1,
    onBoardAreaLayout: fn(),
    onOverlayTopLayout: fn(),
    onOverlayBottomLayout: fn(),
    header: (
      <GameHeader
        code="tabofuna"
        difficulty="easy"
        name="Zoé"
        onQuit={fn()}
        points={375}
        question={t.contourGame.guessPrompt}
        roundNumber={2}
        totalRounds={5}
      />
    ),
  },
} satisfies Meta<typeof ContourFullBleedScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Two hint tiers out (every neighbor's flag, then the country's own): the answer bar floats over
 * the bottom of the board. */
export const Guessing: Story = {
  parameters: source(guessingCode),
  args: {
    hintLabels: buildHintLabels(board, 2, 'fr'),
    footer: <ContourGuessBar guessText="" onChangeGuessText={fn()} onHint={fn()} onSubmit={fn()} />,
  },
};

/** Round over: every tier is shown, name included, and the footer carries the result. */
export const Revealed: Story = {
  parameters: source(revealedCode),
  args: {
    hintLabels: buildHintLabels(board, 4, 'fr'),
    footer: <Button label={t.contourGame.continueLabel} onPress={fn()} />,
  },
};
