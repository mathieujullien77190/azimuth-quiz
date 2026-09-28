import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CONTOURS, PLAYER_COLORS } from '@/data';
import { countryName, flagEmoji } from '@/data/places/countries';
import { CONTOUR_GUESS_POINTS_BY_HINTS, CONTOUR_WRONG_GUESS_PENALTY } from '@/games/contour/constants';
import { formatNumber, playerDisplayName } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useContourSettings } from '@/settings';
import { useThemedStyles } from '@/themes';
import type { ContourCountry, ContourPhase, ContourRoundRecord, Difficulty } from '@/types';

import ContourBoard from '../../components/ContourBoard';
import ContourFullBleedScreen from '../../components/ContourFullBleedScreen';
import ContourGuessBar from '../../components/ContourGuessBar';
import { normalizeContourGuess, randomCountry } from '../../helpers/contourCountry';
import { buildHintLabels } from '../../helpers/roundBoard';
import { useRoundBoard } from '../../helpers/useRoundBoard';
import FinalStandings from '@/components/FinalStandings';
import GameHeader from '@/components/GameHeader';
import Button from '@/components/ui/Button';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import Screen from '@/components/ui/Screen';
import { contourPlayerTotals } from './helpers';
import type { ContourGameScreenProps } from './types';

import { createStyles } from './styles';

/** What's actually random about a round: picked once (`buildRoundSeed`, in `startRound`) and kept
 * fixed until the next one. Deliberately excludes anything screen-space (that's `RoundBoard`,
 * re-derived live from this + the measured board area — see `useRoundBoard`) so a live resize
 * (e.g. rotating the device) reflows the same round instead of re-rolling it. */
type RoundSeed = {
  country: ContourCountry;
};

const buildRoundSeed = (excludeCode: string | undefined, difficulty: Difficulty): RoundSeed => ({
  country: randomCountry(CONTOURS, difficulty, excludeCode),
});

/** Result of the round's 'guess' phase, once resolved (a correct guess or a give-up) — carried
 * straight into `finishRound` so the round record can be built from it. */
type GuessOutcome = { playerIndex: number; hintsUsed: number; guessPoints: number };

export const ContourGameScreen = ({ onQuit }: ContourGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();
  const { language } = useLanguage();
  const { settings } = useContourSettings();

  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerOrder = players.map((_, index) => index);
  const isMultiplayer = players.length > 1;

  const [roundIndex, setRoundIndex] = useState(0);
  const [roundSeed, setRoundSeed] = useState<RoundSeed>(() => buildRoundSeed(undefined, settings.difficulty));
  const [phase, setPhase] = useState<ContourPhase>('guess');
  // Full-bleed only in 'guess' (the reveal is an ordinary `Screen` layout, no overlays): see
  // `useRoundBoard`, shared with the online game.
  const isFullBleedPhase = phase === 'guess';
  const { board, onBoardAreaLayout, onOverlayTopLayout, onOverlayBottomLayout } = useRoundBoard(
    roundSeed.country,
    isFullBleedPhase,
  );
  // --- guess phase (shared, not turn-based): the input/"Valider" pair is always on screen, no
  // buzz-in step — anyone can type an answer. Validating checks it immediately and switches to a
  // player-attribution step (`pendingCorrect`): correct scores whoever gets picked (see
  // `resolveGuess`); wrong deducts CONTOUR_WRONG_GUESS_PENALTY from them instead and reopens the
  // input for another attempt, same hint tier. ---
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [guessText, setGuessText] = useState('');
  const [pendingCorrect, setPendingCorrect] = useState<boolean | null>(null);
  const [penalizedPlayer, setPenalizedPlayer] = useState<string | null>(null);
  // Cumulative CONTOUR_WRONG_GUESS_PENALTY hits this round, by player index — folded into
  // `finishCityPhase`'s per-player `penaltyPoints` (persists across attempts within the round,
  // reset in `startRound`).
  const [roundPenalties, setRoundPenalties] = useState<number[]>(() => players.map(() => 0));

  const [records, setRecords] = useState<ContourRoundRecord[]>([]);

  const isLastRound = roundIndex + 1 >= settings.rounds;
  const currentRecord = records[roundIndex];

  const startRound = (excludeCode: string) => {
    setRoundSeed(buildRoundSeed(excludeCode, settings.difficulty));
    setPhase('guess');
    setHintsRevealed(0);
    setGuessText('');
    setPendingCorrect(null);
    setPenalizedPlayer(null);
    setRoundPenalties(players.map(() => 0));
  };

  // --- guess phase ---

  /** "Indice": reveals the next of the 4 on-board hint tiers (1: every neighbor's icon, 2: the
   * target country's own flag, 3: every neighbor's name, 4: its own name — effectively the
   * answer) — caps at 4, past which the button disappears in favor of an explicit "Continuer"
   * (`confirmNoGuess`) in the footer. */
  const revealHint = () => setHintsRevealed((n) => Math.min(n + 1, 4));

  /** "Valider": checks the typed text immediately (nobody's identity involved yet) and switches
   * to the attribution step (`pendingCorrect`) — the player tabs that follow decide who scores
   * (if correct) or gets penalized (if not), see `attributeGuess`. */
  const submitGuess = () => {
    if (guessText.trim().length === 0) return;
    const correct =
      normalizeContourGuess(guessText) === normalizeContourGuess(countryName(board.country.code, language));
    setPendingCorrect(correct);
    setPenalizedPlayer(null);
  };

  /** Resolves the pending "Valider" result once a player's picked as who answered: a correct
   * guess scores them (tiered by hints already revealed) and finishes the round (`resolveGuess`);
   * a wrong one deducts CONTOUR_WRONG_GUESS_PENALTY from their running total and reopens the same
   * input for another attempt, same hint tier — nothing about the round resets. */
  const attributeGuess = (index: number) => {
    if (pendingCorrect) {
      resolveGuess({
        playerIndex: index,
        hintsUsed: hintsRevealed,
        guessPoints: CONTOUR_GUESS_POINTS_BY_HINTS[hintsRevealed],
      });
      return;
    }
    setRoundPenalties((previous) =>
      previous.map((points, i) => (i === index ? points + CONTOUR_WRONG_GUESS_PENALTY : points)),
    );
    setPenalizedPlayer(players[index]);
    setPendingCorrect(null);
    setGuessText('');
  };

  /** Once tier 4 has revealed the country's own name (`hintsRevealed === 4`, the footer's
   * "Continuer" confirmation): nobody scores, same as the old give-up — a deliberate explicit
   * click rather than an automatic transition the instant the name appears, consistent with the
   * rest of the app's button-driven pacing. */
  const confirmNoGuess = () => resolveGuess({ playerIndex: -1, hintsUsed: hintsRevealed, guessPoints: 0 });

  /** Shared by a correct guess and a give-up: builds the round's results straight from the guess
   * outcome and moves to the final reveal — nothing else contributes to the score any more. */
  const resolveGuess = (outcome: GuessOutcome) => {
    setPendingCorrect(null);
    setGuessText('');

    const results = players.map((_, playerIndex) => {
      const isGuesser = playerIndex === outcome.playerIndex;
      const guessPoints = isGuesser ? outcome.guessPoints : 0;
      const penaltyPoints = roundPenalties[playerIndex] ?? 0;

      return {
        score: {
          hintsUsed: isGuesser ? outcome.hintsUsed : 0,
          guessPoints,
          penaltyPoints,
          total: guessPoints - penaltyPoints,
        },
      };
    });
    setRecords((previous) => [
      ...previous,
      {
        country: board.country,
        outline: board.outline,
        width: board.width,
        height: board.height,
        guesserIndex: outcome.playerIndex,
        results,
      },
    ]);
    setPhase('reveal');
  };

  // --- final reveal / round advance ---

  const next = () => {
    if (isLastRound) {
      setPhase('end');
      return;
    }
    setRoundIndex((index) => index + 1);
    startRound(board.country.code);
  };

  if (phase === 'end') {
    const totals = contourPlayerTotals(records, players.length);
    return (
      <FinalStandings
        entries={players.map((name, index) => ({ name, total: totals[index] }))}
        homeLabel={t.contourGame.home}
        onHome={onQuit}
        title={t.contourGame.finalScoreTitle}
      />
    );
  }

  const totals = contourPlayerTotals(records, players.length);
  const scoreLabel =
    phase === 'reveal'
      ? isMultiplayer
        ? t.game.roundOver
        : `${formatNumber(totals[0])} ${t.common.pts}`
      : isMultiplayer
        ? ''
        : `${formatNumber(totals[0])} ${t.common.pts}`;

  // Points a correct guess would earn right now: drops one tier (CONTOUR_GUESS_POINTS_BY_HINTS)
  // each time "Indice" is pressed, down to 0 once tier 4 (the give-up) is revealed.
  const currentGuessPoints = hintsRevealed >= 4 ? 0 : CONTOUR_GUESS_POINTS_BY_HINTS[hintsRevealed];

  const guessHintLabels = phase === 'guess' ? buildHintLabels(board, hintsRevealed, language) : [];

  // 'guess': the board fills the entire safe area (see `fullBleedBoardArea`, measured by
  // `onBoardAreaLayout`) instead of whatever's left between a header and a footer band — the
  // former header/footer content now floats on top of it instead, in `overlayTop`/`overlayBottom`
  // (translucent, bordered, positioned absolutely so they don't reserve their own layout space).
  // 'reveal' keeps the ordinary `Screen` header/footer/scrollable-content layout below: it has a
  // results table to show beneath the board, not just a couple of floating controls over it.
  if (phase === 'guess') {
    return (
      <ContourFullBleedScreen
        board={board}
        footer={
          hintsRevealed >= 4 ? (
            <View style={styles.guessFooter}>
              <NoOneFoundText players={players} />
              <Button label={t.contourGame.continueLabel} onPress={confirmNoGuess} />
            </View>
          ) : (
            <ContourGuessBar
              guessText={guessText}
              onChangeGuessText={setGuessText}
              onHint={revealHint}
              onSubmit={submitGuess}
              wrongText={penalizedPlayer !== null ? t.contourGame.wrongGuess(penalizedPlayer) : null}
            />
          )
        }
        header={
          <GameHeader
            difficulties={[settings.difficulty]}
            onQuit={onQuit}
            roundNumber={roundIndex + 1}
            scoreLabel={`${formatNumber(currentGuessPoints)} ${t.common.pts}`}
            totalRounds={settings.rounds}
          >
            <View style={styles.countryCard}>
              <Text style={styles.countryName}>{t.contourGame.guessPrompt}</Text>
            </View>
          </GameHeader>
        }
        hintLabels={guessHintLabels}
        onBoardAreaLayout={onBoardAreaLayout}
        onOverlayBottomLayout={onOverlayBottomLayout}
        onOverlayTopLayout={onOverlayTopLayout}
        roundKey={roundIndex}
      >
        {/* Post-"Valider" step (see `validateGuess`/`pendingCorrect`): covers the whole screen,
            same full-screen "who answered" pattern as ClueGameScreen — a mis-tap on "Valider"
            still needs a player picked either way (the penalty/reward can't be skipped on a
            miss), so both outcomes show their own banner here rather than just the correct one. */}
        {pendingCorrect !== null && (
          <View style={styles.attributeOverlay}>
            <Text style={pendingCorrect ? styles.resultOkText : styles.wrongGuessText}>
              {pendingCorrect ? t.contourGame.resultOk : t.contourGame.resultNotOk}
            </Text>
            <Text style={styles.attributePrompt}>{t.contourGame.whoAnswered}</Text>
            <View style={styles.attributeGrid}>
              {playerOrder.map((index) => (
                <Pressable
                  accessibilityRole="button"
                  key={index}
                  onPress={() => attributeGuess(index)}
                  style={[styles.attributeButton, { borderColor: PLAYER_COLORS[index] }]}
                >
                  <Text style={styles.attributeButtonText}>{players[index]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ContourFullBleedScreen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.revealFooter}>
          <Text style={styles.score}>{scoreLabel}</Text>
          <Button label={isLastRound ? t.game.last : t.game.next} onPress={next} />
        </View>
      }
      header={
        <GameHeader
          difficulties={[settings.difficulty]}
          onQuit={onQuit}
          roundNumber={roundIndex + 1}
          totalRounds={settings.rounds}
        />
      }
    >
      <View style={styles.countryCard}>
        <Text style={styles.countryName}>
          <Text style={styles.flagEmoji}>{flagEmoji(board.country.code)}</Text>{' '}
          {countryName(board.country.code, language)}
        </Text>
      </View>

      <View style={styles.boardArea}>
        {currentRecord && (
          <View style={styles.boardFrame}>
            {/* Drawn at the record's own frozen size (see `ContourRoundRecord.width`/`height`),
                not re-fit to this area: reveal's layout never matches the 'guess' phase's own
                full-bleed box the stored outline was projected at, so re-fitting here would
                desync the frozen pixel positions from a freshly re-projected outline. */}
            <ContourBoard
              height={currentRecord.height}
              key={roundIndex}
              outline={currentRecord.outline}
              width={currentRecord.width}
            />
          </View>
        )}
      </View>

      {currentRecord && (
        <View style={styles.resultsList}>
          {currentRecord.results
            .map((result, index) => ({ result, index }))
            .sort((a, b) => b.result.score.total - a.result.score.total)
            .map(({ result, index }, rank) => (
              <View key={index} style={[styles.resultRow, rank > 0 && styles.resultRowBorder]}>
                <View style={[styles.resultDot, { backgroundColor: PLAYER_COLORS[index] }]} />
                <View style={styles.resultTexts}>
                  <Text style={styles.resultName}>{players[index]}</Text>
                </View>
                <Text style={styles.resultPoints}>
                  {formatNumber(result.score.total)} {t.common.pts}
                </Text>
              </View>
            ))}
        </View>
      )}
    </Screen>
  );
};
