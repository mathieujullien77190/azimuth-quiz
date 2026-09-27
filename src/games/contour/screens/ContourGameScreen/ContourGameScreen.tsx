import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CONTOURS, PLAYER_COLORS } from '@/data';
import { countryName, flagEmoji } from '@/data/places/countries';
import { CONTOUR_GUESS_POINTS_BY_HINTS, CONTOUR_WRONG_GUESS_PENALTY } from '@/games/contour/constants';
import { formatNumber, playerDisplayName } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useContourSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { ContourCountry, ContourNeighbor, ContourPhase, ContourRoundRecord, Difficulty, Point2D } from '@/types';

import ContourBoard, {
  BOARD_PADDING_RATIO,
  HINT_STACK_GAP_RATIO,
  boardDimensionsFor,
  createProjector,
  projectPoints,
  type ContourBoardHintLabel,
} from '../../components/ContourBoard';
import GameHeader from '@/components/GameHeader';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import Screen from '@/components/ui/Screen';
import { BOARD_AREA_MARGIN, INITIAL_BOARD_MAX_SIZE } from './constants';
import { contourPlayerTotals, neighborIcon, neighborName, normalizeContourGuess, randomCountry } from './helpers';
import type { ContourGameScreenProps } from './types';

import { createStyles } from './styles';

/** What's actually random about a round: picked once (`buildRoundSeed`, in `startRound`) and kept
 * fixed until the next one. Deliberately excludes anything screen-space (that's `RoundBoard`,
 * re-derived live from this + the measured board area — see `useMemo` below) so a live resize
 * (e.g. rotating the device) reflows the same round instead of re-rolling it. */
type RoundSeed = {
  country: ContourCountry;
};

const buildRoundSeed = (excludeCode: string | undefined, difficulty: Difficulty): RoundSeed => ({
  country: randomCountry(CONTOURS, difficulty, excludeCode),
});

/** Board data for the current round, fit to `maxWidth`/`maxHeight` (the board area's live
 * measured size — see `onBoardAreaLayout`): re-derived (not re-rolled) via `useMemo` whenever
 * either changes, so the same round reflows to fill whatever space is actually available. */
type RoundBoard = {
  country: ContourCountry;
  /** Canvas size, shaped to the country's own aspect ratio (see `boardDimensionsFor`) rather
   * than a fixed square — as large as it can be within `maxWidth`/`maxHeight` without distorting it. */
  width: number;
  height: number;
  /** The country's full outline, projected once for the round — shown as-is from the very start
   * of the 'guess' phase. */
  outline: Point2D[];
  /** Tier 3/4's own on-board anchor for the target country's own flag, then its name stacked just
   * below it (see `HINT_STACK_GAP_RATIO`) — curated per country (`ContourCountry.centerLabel`,
   * a fraction of this canvas, same model as `ContourNeighbor`), rather than a fixed geometric
   * center: lets an oddly-shaped country (or an admin, via the Contour view) place it somewhere
   * that actually reads well over the silhouette. */
  centerPosition: Point2D;
  /** Every curated neighbor (see `ContourCountry.neighbors`), paired with its on-board pixel
   * position (`neighbor.x`/`y` scaled to this round's canvas) and text alignment. */
  neighborHints: { neighbor: ContourNeighbor; position: Point2D }[];
};

const projectRound = (seed: RoundSeed, maxWidth: number, maxHeight: number): RoundBoard => {
  const { country } = seed;
  const { width, height } = boardDimensionsFor(country.points, maxWidth, maxHeight);
  // Ratio of Math.min(width, height), not a fixed pixel count — see BOARD_PADDING_RATIO's own doc
  // comment for why: keeps the admin's differently-sized preview canvas laid out proportionally
  // identical to this board.
  const project = createProjector(country.points, { width, height }, Math.min(width, height) * BOARD_PADDING_RATIO);

  return {
    country,
    width,
    height,
    outline: projectPoints(country.points, project),
    centerPosition: { x: country.centerLabel.x * width, y: country.centerLabel.y * height },
    // `neighbor.x`/`y` are already a fraction of this exact board canvas (see `ContourNeighbor`'s
    // own doc comment) — just scale, no reprojection or edge-clamping needed.
    neighborHints: country.neighbors.map((neighbor) => ({
      neighbor,
      position: { x: neighbor.x * width, y: neighbor.y * height },
    })),
  };
};

/** Result of the round's 'guess' phase, once resolved (a correct guess or a give-up) — carried
 * straight into `finishRound` so the round record can be built from it. */
type GuessOutcome = { playerIndex: number; hintsUsed: number; guessPoints: number };

export const ContourGameScreen = ({ onQuit }: ContourGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { language } = useLanguage();
  const { settings } = useContourSettings();

  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerOrder = players.map((_, index) => index);
  const isMultiplayer = players.length > 1;

  const [roundIndex, setRoundIndex] = useState(0);
  const [roundSeed, setRoundSeed] = useState<RoundSeed>(() => buildRoundSeed(undefined, settings.difficulty));
  // The board area's live measured size (see `onBoardAreaLayout`) — `null` for the one frame
  // before its first `onLayout` fires, so `board` below falls back to a sane placeholder box.
  const [boardAreaSize, setBoardAreaSize] = useState<{ width: number; height: number } | null>(null);
  const onBoardAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardAreaSize((previous) =>
      previous?.width === width && previous?.height === height ? previous : { width, height },
    );
  };
  // Re-fit (not re-roll) `roundSeed` to the live measured box: recomputes whenever the round
  // changes or the box itself does (device rotation, or the 'guess' -> 'city' phase's different
  // surrounding chrome resizing it — see `boardArea`'s own doc comment). Shaved by
  // `BOARD_AREA_MARGIN` on every side first, so the board's own frame doesn't touch the measured
  // box's edges (the full screen, in 'guess'/'city' — see `fullBleedBoardArea`).
  const [phase, setPhase] = useState<ContourPhase>('guess');
  // 'guess' only: live heights of the translucent `overlayTop`/`overlayBottom` bands that float
  // on top of the full-bleed board (see their own onLayout below) — subtracted from the height
  // budget the board is fit into (see `board` below), so a tall/narrow country (e.g. Portugal)
  // doesn't fit itself edge-to-edge past those bands and end up with its top/bottom hidden
  // underneath them. Left at 0 outside 'guess' (the 'reveal'/'end' board area is a different,
  // ordinary-flow View with no overlays to account for).
  const [overlayTopHeight, setOverlayTopHeight] = useState(0);
  const [overlayBottomHeight, setOverlayBottomHeight] = useState(0);
  const onOverlayTopLayout = (event: LayoutChangeEvent) => setOverlayTopHeight(event.nativeEvent.layout.height);
  const onOverlayBottomLayout = (event: LayoutChangeEvent) => setOverlayBottomHeight(event.nativeEvent.layout.height);
  const isFullBleedPhase = phase === 'guess';
  const board = useMemo(
    () =>
      projectRound(
        roundSeed,
        (boardAreaSize?.width ?? INITIAL_BOARD_MAX_SIZE) - BOARD_AREA_MARGIN * 2,
        (boardAreaSize?.height ?? INITIAL_BOARD_MAX_SIZE) -
          BOARD_AREA_MARGIN * 2 -
          (isFullBleedPhase ? overlayTopHeight + overlayBottomHeight : 0),
      ),
    [roundSeed, boardAreaSize, isFullBleedPhase, overlayTopHeight, overlayBottomHeight],
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
    const standings = players.map((name, index) => ({ name, total: totals[index] })).sort((a, b) => b.total - a.total);
    const highest = standings[0].total;
    const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

    return (
      <Screen>
        <Text style={styles.title}>{t.contourGame.finalScoreTitle}</Text>
        {players.length > 1 && (
          <Text style={styles.resultBanner}>
            {winners.length > 1
              ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `))
              : t.endScreen.winner(winners[0])}
          </Text>
        )}
        <Card>
          {standings.map((entry, index) => (
            <View key={entry.name + index} style={[styles.standingRow, index > 0 && styles.standingRowBorder]}>
              <Text style={styles.standingRank}>{index + 1}.</Text>
              <Text style={styles.standingName}>{entry.name}</Text>
              <Text style={styles.standingScore}>
                {formatNumber(entry.total)} {t.common.pts}
              </Text>
            </View>
          ))}
        </Card>
        <Button label={t.contourGame.home} onPress={onQuit} />
      </Screen>
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

  // The 4 guess-phase hint tiers, all drawn straight on the board (positions computed once per
  // round in `buildRound`): tier 1 shows every neighbor's flag at its own curated spot, tier 2
  // adds the target country's own flag at its curated spot, tier 3 stacks each
  // neighbor's name just below its own icon (not swapped — both stay up so the icon keeps
  // reading as "this is what that name refers to"), tier 4 stacks the country's name below its
  // flag the same way.
  const stackGap = Math.min(board.width, board.height) * HINT_STACK_GAP_RATIO;
  const neighborHintLabels: ContourBoardHintLabel[] =
    phase === 'guess' && hintsRevealed >= 1
      ? board.neighborHints.flatMap(({ neighbor, position }) => [
          { position, icon: true, text: neighborIcon(neighbor) },
          ...(hintsRevealed >= 3
            ? [{ position: { x: position.x, y: position.y + stackGap }, text: neighborName(neighbor, language) }]
            : []),
        ])
      : [];
  const centerHintLabels: ContourBoardHintLabel[] =
    phase === 'guess'
      ? [
          ...(hintsRevealed >= 2
            ? [{ position: board.centerPosition, icon: true, text: flagEmoji(board.country.code) }]
            : []),
          ...(hintsRevealed >= 4
            ? [
                {
                  position: { x: board.centerPosition.x, y: board.centerPosition.y + stackGap },
                  text: countryName(board.country.code, language),
                },
              ]
            : []),
        ]
      : [];
  const guessHintLabels: ContourBoardHintLabel[] = [...neighborHintLabels, ...centerHintLabels];

  // 'guess': the board fills the entire safe area (see `fullBleedBoardArea`, measured by
  // `onBoardAreaLayout`) instead of whatever's left between a header and a footer band — the
  // former header/footer content now floats on top of it instead, in `overlayTop`/`overlayBottom`
  // (translucent, bordered, positioned absolutely so they don't reserve their own layout space).
  // 'reveal' keeps the ordinary `Screen` header/footer/scrollable-content layout below: it has a
  // results table to show beneath the board, not just a couple of floating controls over it.
  if (phase === 'guess') {
    return (
      <SafeAreaView style={styles.fullBleedSafeArea}>
        <ThemeBackdrop />
        <View onLayout={onBoardAreaLayout} style={styles.fullBleedBoardArea}>
          <View style={styles.boardFrame}>
            <ContourBoard
              height={board.height}
              hintLabels={guessHintLabels}
              key={roundIndex}
              outline={board.outline}
              width={board.width}
            />
          </View>
        </View>

        <View onLayout={onOverlayTopLayout} style={styles.overlayTopPosition}>
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
        </View>

        <View onLayout={onOverlayBottomLayout} style={styles.overlayBottom}>
          {hintsRevealed >= 4 ? (
            <View style={styles.guessFooter}>
              <NoOneFoundText players={players} />
              <Button label={t.contourGame.continueLabel} onPress={confirmNoGuess} />
            </View>
          ) : (
            <View style={styles.guessFooter}>
              {penalizedPlayer !== null && (
                <Text style={styles.wrongGuessText}>{t.contourGame.wrongGuess(penalizedPlayer)}</Text>
              )}
              <View style={styles.buzzInputRow}>
                <Pressable
                  accessibilityLabel={t.contourGame.hintButton}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={revealHint}
                  style={styles.hintFab}
                >
                  <Text style={styles.hintFabIcon}>💡</Text>
                </Pressable>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setGuessText}
                  onSubmitEditing={submitGuess}
                  placeholder={t.contourGame.guessPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  style={[styles.guessInput, styles.guessInputFlex]}
                  value={guessText}
                />
              </View>
              <Button disabled={guessText.trim().length === 0} label={t.game.validate} onPress={submitGuess} />
            </View>
          )}
        </View>

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
      </SafeAreaView>
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
