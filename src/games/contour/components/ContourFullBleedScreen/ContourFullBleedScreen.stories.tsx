import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import GameFooter from '@/components/GameFooter';
import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import { SAMPLE_CONTOUR_COUNTRY } from '@/helpers/storyFixtures';
import type { Language, Translations } from '@/i18n';
import { translations } from '@/i18n/translations';
import { localizedArgs } from '@/storybook/localized';
import { source } from '@/storybook/source';

import ContourGuessBar from '../ContourGuessBar';
import { buildHintLabels, projectRound } from '../../helpers/roundBoard';
import { ContourFullBleedScreen } from './ContourFullBleedScreen';
import coarseCode from './CoarseSilhouette.source.md?raw';
import guessingCode from './Guessing.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

const t = translations.fr;

// The screen fills its safe area — a sized flex box stands in for the phone. The board is fit to a
// fixed box here; in the game, `useRoundBoard` measures the real one.
const board = projectRound(SAMPLE_CONTOUR_COUNTRY, 380, 300);

/** The header (with the round's question), in the toolbar's language. */
const headerArgs = (texts: Translations) => ({
  header: (
    <GameHeader
      code="tabofuna"
      difficulty="easy"
      name="Zoé"
      onQuit={fn()}
      points={375}
      question={texts.contourGame.guessPrompt}
      roundNumber={2}
      totalRounds={5}
    />
  ),
});

/** The board's hint labels (country names follow the language) and the footer, per story. */
const guessingArgs = (_texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  hintLabels: buildHintLabels(board, 5, language),
  footer: (
    <GameFooter>
      <ContourGuessBar guessText="" onChangeGuessText={fn()} onHint={fn()} onSubmit={fn()} />
    </GameFooter>
  ),
});
const coarseArgs = (_texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  ...guessingArgs(_texts, _args, language),
  hintLabels: buildHintLabels(board, 0, language),
  precision: 0,
});
const revealedArgs = (texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  hintLabels: buildHintLabels(board, 7, language),
  footer: (
    <GameFooter>
      <Button label={texts.contourGame.continueLabel} onPress={fn()} />
    </GameFooter>
  ),
});

const meta = {
  title: 'Silhouette/ContourFullBleedScreen',
  component: ContourFullBleedScreen,
  decorators: [
    localizedArgs(headerArgs),
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
    ...headerArgs(t),
  },
} satisfies Meta<typeof ContourFullBleedScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Five hint tiers out (the outline is the full ring, then every neighbor's flag, then the country's
 * own): the answer bar floats over the bottom of the board. */
export const Guessing: Story = {
  parameters: source(guessingCode),
  decorators: [localizedArgs(guessingArgs)],
  args: guessingArgs(t, {}, 'fr'),
};

/** Nothing revealed yet: the silhouette is a handful of segments (`precision` 0), with no neighbor
 * around it — each hint makes the outline more precise, up to the full ring at tier 3. */
export const CoarseSilhouette: Story = {
  parameters: source(coarseCode),
  decorators: [localizedArgs(coarseArgs)],
  args: coarseArgs(t, {}, 'fr'),
};

/** Round over: every tier is shown, name included, and the footer carries the result. */
export const Revealed: Story = {
  parameters: source(revealedCode),
  decorators: [localizedArgs(revealedArgs)],
  args: revealedArgs(t, {}, 'fr'),
};
