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
import { buildHintPlan } from '../../helpers/hintPlan';
import { buildHintLabels, projectRound } from '../../helpers/roundBoard';
import { ContourFullBleedScreen } from './ContourFullBleedScreen';
import capitalCode from './CapitalOnly.source.md?raw';
import coarseCode from './CoarseSilhouette.source.md?raw';
import guessingCode from './Guessing.source.md?raw';
import revealedCode from './Revealed.source.md?raw';

const t = translations.fr;

// The screen fills its safe area — a sized flex box stands in for the phone. The board is fit to a
// fixed box here; in the game, `useRoundBoard` measures the real one.
const board = projectRound(SAMPLE_CONTOUR_COUNTRY, 380, 300);

// Every kind of hint in play: 3 silhouette steps, 3 for the neighbors, 2 for the cities, 2 for the capital,
// then the reveal (11 steps for France).
const PLAN = buildHintPlan(['silhouette', 'neighbors', 'cities', 'capital'], SAMPLE_CONTOUR_COUNTRY);

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
  plan: PLAN,
  hintLabels: buildHintLabels(board, PLAN, 8, language),
  hintsRevealed: 8,
  footer: (
    <GameFooter>
      <ContourGuessBar guessText="" onChangeGuessText={fn()} onHint={fn()} onSubmit={fn()} />
    </GameFooter>
  ),
});
const coarseArgs = (_texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  ...guessingArgs(_texts, _args, language),
  hintLabels: buildHintLabels(board, PLAN, 0, language),
  hintsRevealed: 0,
});
// Only the capital in play, and no silhouette hint: the full ring from the start, a star after one hint.
const CAPITAL_PLAN = buildHintPlan(['capital'], SAMPLE_CONTOUR_COUNTRY);
const capitalArgs = (_texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  ...guessingArgs(_texts, _args, language),
  plan: CAPITAL_PLAN,
  hintLabels: buildHintLabels(board, CAPITAL_PLAN, 1, language),
  hintsRevealed: 1,
});
const revealedArgs = (texts: Translations, _args: Record<string, unknown>, language: Language) => ({
  plan: PLAN,
  hintLabels: buildHintLabels(board, PLAN, PLAN.length, language),
  hintsRevealed: PLAN.length,
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
    plan: PLAN,
    hintsRevealed: 0,
    roundKey: 1,
    onBoardAreaLayout: fn(),
    onOverlayTopLayout: fn(),
    onOverlayBottomLayout: fn(),
    ...headerArgs(t),
  },
} satisfies Meta<typeof ContourFullBleedScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Eight hints out of 11: the full ring with its neighbors, their flags and names, the cities as dots
 * and their names. The answer bar floats over the bottom of the board. */
export const Guessing: Story = {
  parameters: source(guessingCode),
  decorators: [localizedArgs(guessingArgs)],
  args: guessingArgs(t, {}, 'fr'),
};

/** Nothing revealed yet: the silhouette is a handful of segments (`hintsRevealed` 0), with no neighbor
 * around it — each hint makes the outline more precise, up to the full ring after 3, then the neighbors. */
export const CoarseSilhouette: Story = {
  parameters: source(coarseCode),
  decorators: [localizedArgs(coarseArgs)],
  args: coarseArgs(t, {}, 'fr'),
};

/** A reduced game, capital hints only: no silhouette steps, so the country is drawn as the full ring from
 * the start, and the first hint puts the capital's star on it. */
export const CapitalOnly: Story = {
  parameters: source(capitalCode),
  decorators: [localizedArgs(capitalArgs)],
  args: capitalArgs(t, {}, 'fr'),
};

/** Round over: every step is shown, the country flag and name included, and the footer carries the result. */
export const Revealed: Story = {
  parameters: source(revealedCode),
  decorators: [localizedArgs(revealedArgs)],
  args: revealedArgs(t, {}, 'fr'),
};
