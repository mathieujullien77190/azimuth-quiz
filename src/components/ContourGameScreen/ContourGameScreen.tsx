import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { CONTOURS, CONTOUR_HOLE_RATIO, CONTOUR_SOLO_HOLE_RATIO, PLAYER_COLORS, fontSize, spacing } from '@/constants';
import { countryName, flagEmoji } from '@/constants/places/countries';
import { formatNumber, playerDisplayName, scoreCityGuess, scoreContourRound, splitContourHoles } from '@/helpers';
import { useLanguage, useTranslation } from '@/i18n';
import { useContourSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';
import type { ContourCountry, ContourPhase, ContourRoundRecord, ContourTraceScore, Point2D, Theme } from '@/types';

import ContourBoard, {
  BOARD_PADDING,
  boardDimensionsFor,
  createProjector,
  projectPoints,
  type ContourBoardConnector,
  type ContourBoardHoleMarker,
  type ContourBoardMarker,
  type ContourBoardTrace,
} from '../ContourBoard';
import Legend from '../Legend';
import PlayerTabs from '../PlayerTabs';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Screen from '../ui/Screen';
import { boardMaxSizeFor, contourPlayerTotals, nearestUnclaimedHole, randomCountry, randomPlacesFor, rotatedOrder } from './helpers';
import type { ContourGameScreenProps } from './types';

const createStyles = ({ colors, isDark, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
      textAlign: 'center',
    },
    header: {
      backgroundColor: isDark ? colors.background : colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    quit: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    score: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    round: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
      textAlign: 'center',
      paddingBottom: spacing.xs,
    },
    countryCard: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    countryName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    // Flag emoji needs its own font family: Chromium on Windows has no system font that renders
    // flag emoji as flags, falling back to the raw two-letter code (e.g. "ES") instead — see
    // FLAG_FONT_FAMILY's own doc comment. Doesn't apply to the country name right next to it.
    flagEmoji: {
      fontFamily: FLAG_FONT_FAMILY,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    boardCard: {
      alignItems: 'center',
    },
    // Frames the board's exact touch/drawable rectangle: no explicit width/height on purpose, so
    // it shrink-wraps ContourBoard's own `width` x `height` View exactly (the border sits around
    // it, not eating into it) — otherwise the interactive zone isn't visually obvious against the
    // surrounding Card.
    boardFrame: {
      alignSelf: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    resultsCard: {
      gap: spacing.sm,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    resultRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    resultDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    resultTexts: {
      flex: 1,
      gap: 2,
    },
    resultName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
    },
    resultBreakdown: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    resultPoints: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
    },
    standingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    standingRowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    standingRank: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.body,
      width: 24,
    },
    standingName: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.body,
      flex: 1,
    },
    standingScore: {
      ...typography.heading,
      color: colors.accent,
      fontSize: fontSize.body,
    },
    resultBanner: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
      color: colors.success,
    },
  });

/** Board data for the current round: computed once in `startRound` and kept fixed through it
 * (see `boardMaxSizeFor`'s doc comment for why). */
type RoundBoard = {
  country: ContourCountry;
  /** Canvas size, shaped to the country's own aspect ratio (see `boardDimensionsFor`) rather
   * than a fixed square. */
  width: number;
  height: number;
  /** Single scalar for the scoring tolerance (see `scoreContourRound`/`scoreCityGuess`): the
   * average of `width`/`height`, so tolerance stays reasonable on both axes even for an
   * elongated country instead of favoring whichever axis a diagonal or a single dimension would. */
  boardSize: number;
  /** Fixed arcs shown throughout the round, one per hole (a single one covering ~60% of the ring
   * in solo, since there's only one hole there — see `buildRound`). */
  visibleSegments: Point2D[][];
  /** One hidden gap per player: `holes[i]` is whichever player's `holeAssignment` points to `i`
   * claimed (see `nearestUnclaimedHole`) — its true arc is drawn directly on the board (in
   * `colors.truth`) the moment it's claimed. */
  holes: Point2D[][];
  /** This round's named places (any category, see `randomPlacesFor`): one city-placement step
   * each, in this order. Can be shorter than `ContourSettings.placesCount` (or empty) if the
   * country doesn't have that many matching places. */
  places: { name: string; position: Point2D }[];
};

const buildRound = (
  excludeCode: string | undefined,
  windowWidth: number,
  windowHeight: number,
  playerCount: number,
  placesCount: number,
): RoundBoard => {
  const country = randomCountry(CONTOURS, excludeCode);
  const { maxWidth, maxHeight } = boardMaxSizeFor(windowWidth, windowHeight);
  const { width, height } = boardDimensionsFor(country.points, maxWidth, maxHeight);
  const project = createProjector(country.points, { width, height }, BOARD_PADDING);
  const holeRatio = playerCount === 1 ? CONTOUR_SOLO_HOLE_RATIO : CONTOUR_HOLE_RATIO;
  const { holes: holesGeo, visibleSegments: visibleGeo } = splitContourHoles(country.points, playerCount, holeRatio);
  const places = randomPlacesFor(country.code, placesCount);

  return {
    country,
    width,
    height,
    boardSize: (width + height) / 2,
    visibleSegments: visibleGeo.map((segment) => projectPoints(segment, project)),
    holes: holesGeo.map((hole) => projectPoints(hole, project)),
    places: places.map((place) => ({
      name: place.name,
      position: project([place.coordinates.longitude, place.coordinates.latitude]),
    })),
  };
};

/** A committed city answer: wraps the guess (itself possibly `undefined`, if the player placed
 * no marker) so "hasn't answered yet" (slot absent) is never confused with "answered, placed
 * nothing" (slot present, `cityGuess: undefined`) — same reasoning as Boussole's own
 * `guessesByPlayer`. */
type CityAnswer = { cityGuess: Point2D | undefined };

const NO_TRACE_SCORE: ContourTraceScore = { traceErrorPx: Infinity, tracePoints: 0 };

export const ContourGameScreen = ({ onQuit }: ContourGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { language } = useLanguage();
  const { width, height: windowHeight } = useWindowDimensions();
  const { settings } = useContourSettings();

  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const isMultiplayer = players.length > 1;

  const [roundIndex, setRoundIndex] = useState(0);
  const [board, setBoard] = useState<RoundBoard>(() => buildRound(undefined, width, windowHeight, players.length, settings.placesCount));
  const [roundOrder, setRoundOrder] = useState<number[]>(() => rotatedOrder(0, players.length));
  const [activePlayerIndex, setActivePlayerIndex] = useState(() => roundOrder[0] ?? 0);
  const [phase, setPhase] = useState<ContourPhase>('trace');

  // --- trace phase (turn-based): no picking step, the target hole is inferred from the trace
  // itself and claimed the moment it's committed (see `commitActiveTrace`) ---
  const [holeAssignment, setHoleAssignment] = useState<(number | undefined)[]>(() => players.map(() => undefined));
  const [traceDraftsByPlayer, setTraceDraftsByPlayer] = useState<Point2D[][]>(() => players.map(() => []));
  const [tracesByPlayer, setTracesByPlayer] = useState<(Point2D[] | undefined)[]>(() => players.map(() => undefined));
  const [traceScores, setTraceScores] = useState<ContourTraceScore[]>(() => players.map(() => NO_TRACE_SCORE));

  // --- city phase: one turn-based mini-round per place in `board.places` ---
  const [placeIndex, setPlaceIndex] = useState(0);
  const [cityDraftsByPlayer, setCityDraftsByPlayer] = useState<(Point2D | undefined)[]>(() => players.map(() => undefined));
  const [cityAnswersByPlayer, setCityAnswersByPlayer] = useState<(CityAnswer | undefined)[]>(() => players.map(() => undefined));
  // Guesses for every place already finished this round: `placeGuesses[p][playerIndex]`.
  const [placeGuesses, setPlaceGuesses] = useState<(Point2D | undefined)[][]>([]);

  const [records, setRecords] = useState<ContourRoundRecord[]>([]);

  const isLastRound = roundIndex + 1 >= settings.rounds;
  const claimedHoleIndexes = new Set(holeAssignment.filter((index): index is number => index !== undefined));
  const activeTraceDraft = traceDraftsByPlayer[activePlayerIndex] ?? [];
  const activeCityDraft = cityDraftsByPlayer[activePlayerIndex];
  const traceAnsweredByPlayer = tracesByPlayer.map((trace) => trace !== undefined);
  const cityAnsweredByPlayer = cityAnswersByPlayer.map((answer) => answer !== undefined);
  const currentRecord = records[roundIndex];
  const activePlace = board.places[placeIndex];
  /** Every hole is claimed and every player has submitted (see `submitTrace`, which deliberately
   * doesn't auto-advance once this becomes true): the board keeps showing every player's own
   * guess trace until `startCityPhase` (the "reveal" button) swaps them for the true contour. */
  const traceComplete = phase === 'trace' && !roundOrder.some((index) => tracesByPlayer[index] === undefined);
  /** Everyone's answered the current place (see `submitCity`, which deliberately doesn't
   * auto-advance once this becomes true): the board shows that place's solution + every guess
   * together until `continuePlaces` moves on. */
  const placeComplete = phase === 'city' && !roundOrder.some((index) => cityAnswersByPlayer[index] === undefined);

  const startRound = (index: number, excludeCode: string) => {
    setBoard(buildRound(excludeCode, width, windowHeight, players.length, settings.placesCount));
    const order = rotatedOrder(index, players.length);
    setRoundOrder(order);
    setActivePlayerIndex(order[0] ?? 0);
    setPhase('trace');
    setHoleAssignment(players.map(() => undefined));
    setTraceDraftsByPlayer(players.map(() => []));
    setTracesByPlayer(players.map(() => undefined));
    setTraceScores(players.map(() => NO_TRACE_SCORE));
    setPlaceIndex(0);
    setPlaceGuesses([]);
    setCityDraftsByPlayer(players.map(() => undefined));
    setCityAnswersByPlayer(players.map(() => undefined));
  };

  // --- trace phase ---

  /**
   * Commits the active player's trace and, the first time (no take-backs, no re-matching on a
   * later revision), claims whichever still-unclaimed hole it was nearest to — removing it from
   * the pool for everyone else — and reveals its true arc right on the board (see `traces` below,
   * built from `holeAssignment`). Scores against that same hole every time this runs (so a later
   * revision via `allowRevision` re-scores the redrawn trace, still against the original hole).
   */
  const commitActiveTrace = (): { updated: (Point2D[] | undefined)[]; complete: boolean } => {
    const trace = traceDraftsByPlayer[activePlayerIndex] ?? [];
    const updated = tracesByPlayer.map((existing, index) => (index === activePlayerIndex ? trace : existing));
    setTracesByPlayer(updated);

    const alreadyClaimed = holeAssignment[activePlayerIndex];
    const holeIndex = alreadyClaimed ?? nearestUnclaimedHole(trace, board.holes, claimedHoleIndexes);

    if (holeIndex !== -1) {
      if (alreadyClaimed === undefined) {
        setHoleAssignment((previous) => previous.map((assigned, index) => (index === activePlayerIndex ? holeIndex : assigned)));
      }
      const score = scoreContourRound(trace, board.holes[holeIndex], board.boardSize);
      setTraceScores((previous) => previous.map((existing, index) => (index === activePlayerIndex ? score : existing)));
    }

    return { updated, complete: !roundOrder.some((index) => updated[index] === undefined) };
  };

  const selectPlayerTrace = (index: number) => {
    if (index === activePlayerIndex) return;
    commitActiveTrace();
    setActivePlayerIndex(index);
  };

  /** Once every hole is claimed and every player has submitted (see `traceComplete`), this
   * deliberately stops rather than auto-advancing: the board keeps showing every player's own
   * guess trace until the player presses the "reveal" button (`startCityPhase`), which swaps
   * them for the true contour (see the `traces` prop, gated on `phase`) and starts the city
   * phase in the same action. */
  const submitTrace = () => {
    const { updated, complete } = commitActiveTrace();
    if (complete) return;
    const nextUnanswered = roundOrder.find((index) => updated[index] === undefined) as number;
    setActivePlayerIndex(nextUnanswered);
  };

  const setActiveTraceDraft = (trace: Point2D[]) => {
    setTraceDraftsByPlayer((previous) => previous.map((draft, index) => (index === activePlayerIndex ? trace : draft)));
  };

  // --- city phase ---

  /** The trace phase's "reveal" button: every hole is already claimed at this point, so simply
   * leaving `phase` swaps the board's `traces` from every player's guess to the true contour (see
   * the `traces` prop below, gated on `phase`) — moves straight on to the city phase, on the same
   * board, or, if the round drew no places at all, straight past it to the final reveal (no dead
   * screen waiting for a phase with nothing to do). */
  const startCityPhase = () => {
    if (board.places.length === 0) {
      finishCityPhase([]);
      return;
    }
    setPlaceIndex(0);
    setPlaceGuesses([]);
    setActivePlayerIndex(roundOrder[0] ?? 0);
    setCityDraftsByPlayer(players.map(() => undefined));
    setCityAnswersByPlayer(players.map(() => undefined));
    setPhase('city');
  };

  const commitActiveCity = (): { updated: (CityAnswer | undefined)[]; complete: boolean } => {
    const cityGuess = cityDraftsByPlayer[activePlayerIndex];
    const updated = cityAnswersByPlayer.map((existing, index) => (index === activePlayerIndex ? { cityGuess } : existing));
    setCityAnswersByPlayer(updated);
    return { updated, complete: !roundOrder.some((index) => updated[index] === undefined) };
  };

  /** Combines the trace scores (locked in progressively back during the trace phase) with the
   * sum of every place's city score into the round's final results. `allGuesses[p][playerIndex]`
   * is that player's marker for place `p` — built up across places by `submitCity` and passed in
   * whole once the last one is done (or immediately, empty, if the round had no places at all). */
  const finishCityPhase = (allGuesses: (Point2D | undefined)[][]) => {
    const results = players.map((_, playerIndex) => {
      const traceScore = traceScores[playerIndex];
      const cityScores = allGuesses.map((placePlayerGuesses, placeIdx) =>
        scoreCityGuess(placePlayerGuesses[playerIndex], board.places[placeIdx].position, board.boardSize),
      );
      const cityPoints = cityScores.reduce((sum, score) => sum + score.cityPoints, 0);
      const finiteErrors = cityScores.map((score) => score.cityErrorPx).filter(Number.isFinite);
      const cityErrorPx = finiteErrors.length > 0 ? finiteErrors.reduce((sum, error) => sum + error, 0) / finiteErrors.length : Infinity;

      return {
        trace: tracesByPlayer[playerIndex] ?? [],
        cityGuesses: allGuesses.map((placePlayerGuesses) => placePlayerGuesses[playerIndex]),
        score: { ...traceScore, cityErrorPx, cityPoints, total: traceScore.tracePoints + cityPoints },
      };
    });
    setRecords((previous) => [
      ...previous,
      {
        country: board.country,
        visibleSegments: board.visibleSegments,
        holes: board.holes,
        boardSize: board.boardSize,
        places: board.places,
        // Never actually undefined here in practice (a trace only ever commits once its player
        // has claimed a hole), the fallback just satisfies the type.
        holeAssignment: holeAssignment.map((holeIndex) => holeIndex ?? 0),
        results,
      },
    ]);
    setPhase('reveal');
  };

  const selectPlayerCity = (index: number) => {
    if (index === activePlayerIndex) return;
    commitActiveCity();
    setActivePlayerIndex(index);
  };

  /** Commits the active player's guess for the current place. Once everyone's answered it, stops
   * there (doesn't auto-advance): the board then shows that place's solution + every player's
   * guess together (see `placeComplete`/`cityStepMarkers`) until `continuePlaces` is pressed. */
  const submitCity = () => {
    const { updated, complete } = commitActiveCity();
    if (complete) return;
    const nextUnanswered = roundOrder.find((index) => updated[index] === undefined) as number;
    setActivePlayerIndex(nextUnanswered);
  };

  /** Moves on from the current (fully answered, currently shown) place to the next one — or, on
   * the last one, finishes the city phase — clearing the transient per-player guess markers
   * either way (the place's own solution marker, added to `placeGuesses`, stays for the rest of
   * the city phase; see `cityStepMarkers`). */
  const continuePlaces = () => {
    const guesses = cityAnswersByPlayer.map((answer) => answer?.cityGuess);
    const allGuesses = [...placeGuesses, guesses];

    if (placeIndex + 1 < board.places.length) {
      setPlaceGuesses(allGuesses);
      setPlaceIndex((index) => index + 1);
      setActivePlayerIndex(roundOrder[0] ?? 0);
      setCityDraftsByPlayer(players.map(() => undefined));
      setCityAnswersByPlayer(players.map(() => undefined));
      return;
    }

    finishCityPhase(allGuesses);
  };

  const setActiveCityDraft = (point: Point2D) => {
    setCityDraftsByPlayer((previous) => previous.map((draft, index) => (index === activePlayerIndex ? point : draft)));
  };

  // --- final reveal / round advance ---

  const next = () => {
    if (isLastRound) {
      setPhase('end');
      return;
    }
    setRoundIndex((index) => index + 1);
    startRound(roundIndex + 1, board.country.code);
  };

  if (phase === 'end') {
    const totals = contourPlayerTotals(records, players.length);
    const standings = players
      .map((name, index) => ({ name, total: totals[index] }))
      .sort((a, b) => b.total - a.total);
    const highest = standings[0].total;
    const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

    return (
      <Screen>
        <Text style={styles.title}>{t.contourGame.finalScoreTitle}</Text>
        {players.length > 1 && (
          <Text style={styles.resultBanner}>
            {winners.length > 1 ? t.endScreen.tie(winners.join(` ${t.endScreen.and} `)) : t.endScreen.winner(winners[0])}
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
      : `${formatNumber(totals[activePlayerIndex])} ${t.common.pts}`;

  const legendItems = isMultiplayer
    ? [...players.map((name, index) => ({ label: name, color: PLAYER_COLORS[index] })), { label: t.game.reality, color: colors.truth, ring: true }]
    : [{ label: t.game.yourAnswer, color: PLAYER_COLORS[0] }, { label: t.game.reality, color: colors.truth, ring: true }];

  const cityMarkers: ContourBoardMarker[] = currentRecord
    ? currentRecord.places.flatMap((place, placeIdx) => [
        { position: place.position, color: colors.truth, isTruth: true, label: place.name },
        ...currentRecord.results.flatMap((result, playerIndex) => {
          const guess = result.cityGuesses[placeIdx];
          return guess !== undefined ? [{ position: guess, color: PLAYER_COLORS[playerIndex] }] : [];
        }),
      ])
    : [];

  // One dashed line per player guess, straight to its place's solution — same pairing as
  // `cityMarkers` above, just the connecting segment instead of the dot.
  const cityConnectors: ContourBoardConnector[] = currentRecord
    ? currentRecord.places.flatMap((place, placeIdx) =>
        currentRecord.results.flatMap((result) => {
          const guess = result.cityGuesses[placeIdx];
          return guess !== undefined ? [{ from: guess, to: place.position }] : [];
        }),
      )
    : [];

  // City phase, place by place: every already-completed place's solution marker persists for the
  // rest of the city phase (same accumulate pattern as the trace phase's revealed holes). For the
  // current place: each player's guess marker appears the moment they submit (same accumulate
  // pattern as the trace phase's `submittedTraces`, stacking up turn by turn — the active player's
  // own guess is excluded here while they're still placing, since it's already shown live via
  // `placedPoint`/`activeMarkerColor` instead), and the solution marker only joins once everyone's
  // answered (`placeComplete`) — at which point this is just the natural end state of that
  // accumulation, not a separate reveal. Both guesses and the (non-persisted) solution disappear
  // once `continuePlaces` moves on to the next place, which resets `cityAnswersByPlayer`.
  const cityStepMarkers: ContourBoardMarker[] =
    phase === 'city'
      ? [
          ...placeGuesses.map((_, placeIdx) => ({
            position: board.places[placeIdx].position,
            color: colors.truth,
            isTruth: true,
            label: board.places[placeIdx].name,
          })),
          ...(placeComplete ? [{ position: activePlace.position, color: colors.truth, isTruth: true, label: activePlace.name }] : []),
          ...roundOrder.flatMap((index) => {
            if (!placeComplete && index === activePlayerIndex) return [];
            const guess = cityAnswersByPlayer[index]?.cityGuess;
            return guess !== undefined ? [{ position: guess, color: PLAYER_COLORS[index] }] : [];
          }),
        ]
      : [];

  // Only once the current place is complete: every player's guess is final and the solution is
  // shown, exactly the moment `cityStepMarkers` above pairs them up visually as dots — this is
  // the same pairing, as dashed lines instead.
  const cityStepConnectors: ContourBoardConnector[] =
    phase === 'city' && placeComplete
      ? roundOrder.flatMap((index) => {
          const guess = cityAnswersByPlayer[index]?.cityGuess;
          return guess !== undefined ? [{ from: guess, to: activePlace.position }] : [];
        })
      : [];

  // The true contour: revealed hole by hole, immediately as each one is claimed (see
  // `commitActiveTrace`, which updates `holeAssignment`/`claimedHoleIndexes` right on submit) —
  // alongside `submittedTraces` below, not instead of it, so a player's own guess stays visible
  // next to their hole's solution from the moment they submit. By the time the trace phase's
  // "reveal" button (`startCityPhase`) is pressed every hole is already claimed, so it's just a
  // phase transition with nothing left to visually swap. Keyed by hole index so ContourBoard's
  // shared reveal animation only plays once per hole, not again whenever this recomputes.
  const revealedTraces: ContourBoardTrace[] = board.holes
    .map((hole, index) => ({ hole, index }))
    .filter(({ index }) => claimedHoleIndexes.has(index))
    .map(({ hole, index }) => ({ points: hole, color: colors.truth, isTruth: true, key: index }));

  // Every player's own submitted trace, in their color — stacks up turn by turn through the whole
  // trace phase (including once `traceComplete`, right up until the "reveal" button is pressed),
  // then disappears for good once `phase` moves past 'trace' (its hole's `revealedTraces` entry
  // keeps showing on its own from then on). The active player's own trace is excluded here: while
  // they're up (drawing fresh, or revisiting an already-submitted one via allowRevision), their live draft
  // already renders via `activePoints`/`activeColor` — showing both would double it up.
  const submittedTraces: ContourBoardTrace[] =
    phase === 'trace'
      ? tracesByPlayer
          .map((trace, index) => ({ trace, index }))
          .filter(({ trace, index }) => trace !== undefined && trace.length >= 2 && index !== activePlayerIndex)
          .map(({ trace, index }) => ({ points: trace as Point2D[], color: PLAYER_COLORS[index] }))
      : [];

  // Passive location hints (dots) for every hole NOT yet claimed: empty by the time the trace
  // phase is done (every hole is claimed by then), so these need no phase-specific gating — they
  // naturally stop showing once nobody's drawing anymore.
  const unclaimedHoles = board.holes.map((hole, index) => ({ hole, index })).filter(({ index }) => !claimedHoleIndexes.has(index));
  const traceAnchors = unclaimedHoles.flatMap(({ hole }) => [hole[0], hole[hole.length - 1]]);
  // Suppressed for the entire trace phase: the accent-colored dots clash with/clutter the
  // anchors + trace being drawn regardless of stroke state, and the two anchor circles per
  // unclaimed hole are location hint enough on their own during that phase.
  const holeMarkers: ContourBoardHoleMarker[] =
    phase === 'trace'
      ? []
      : unclaimedHoles.map(({ hole }) => ({
          position: hole[Math.floor(hole.length / 2)],
        }));

  const showPlayerTabs = phase === 'trace' || phase === 'city';
  const tabsAnsweredByPlayer = phase === 'city' ? cityAnsweredByPlayer : traceAnsweredByPlayer;
  const tabsOnSelect = phase === 'city' ? selectPlayerCity : selectPlayerTrace;

  return (
    <Screen
      footer={
        phase === 'trace' ? (
          traceComplete ? (
            <Button label={t.contourGame.revealContourLabel} onPress={startCityPhase} />
          ) : (
            <Button disabled={activeTraceDraft.length < 2} label={t.game.validate} onPress={submitTrace} />
          )
        ) : phase === 'city' ? (
          placeComplete ? (
            <Button label={t.contourGame.continueLabel} onPress={continuePlaces} />
          ) : (
            <Button disabled={activeCityDraft === undefined} label={t.game.validate} onPress={submitCity} />
          )
        ) : (
          <Button label={isLastRound ? t.game.last : t.game.next} onPress={next} />
        )
      }
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>
              {isMultiplayer && (phase === 'trace' || phase === 'city') ? `${players[activePlayerIndex]} · ` : ''}
              {scoreLabel}
            </Text>
          </View>
          <Text style={styles.round}>{`${roundIndex + 1} / ${settings.rounds}`}</Text>
          {showPlayerTabs && (
            <PlayerTabs
              activeIndex={activePlayerIndex}
              activeLabel={t.game.playerTurn}
              allowRevision
              answered={tabsAnsweredByPlayer}
              onSelect={tabsOnSelect}
              order={roundOrder}
              players={playerTabs}
            />
          )}
        </View>
      }
    >
      <View style={styles.countryCard}>
        <Text style={styles.countryName}>
          <Text style={styles.flagEmoji}>{flagEmoji(board.country.code)}</Text> {countryName(board.country.code, language)}
        </Text>
        {phase === 'trace' && <Text style={styles.hint}>{t.contourGame.traceHint}</Text>}
        {phase === 'city' && activePlace && (
          <Text style={styles.hint}>{t.contourGame.cityHint(activePlace.name, placeIndex + 1, board.places.length)}</Text>
        )}
      </View>

      <Card style={styles.boardCard}>
        <View style={styles.boardFrame}>
          <ContourBoard
            activeColor={phase === 'trace' ? PLAYER_COLORS[activePlayerIndex] : undefined}
            activeMarkerColor={phase === 'city' && !placeComplete ? PLAYER_COLORS[activePlayerIndex] : undefined}
            activePoints={phase === 'trace' ? activeTraceDraft : undefined}
            anchors={traceAnchors}
            connectors={phase === 'reveal' ? cityConnectors : phase === 'city' ? cityStepConnectors : undefined}
            height={board.height}
            holeMarkers={holeMarkers}
            key={roundIndex}
            markers={phase === 'reveal' ? cityMarkers : phase === 'city' ? cityStepMarkers : undefined}
            onDraw={phase === 'trace' ? setActiveTraceDraft : undefined}
            onPlacePoint={phase === 'city' && !placeComplete ? setActiveCityDraft : undefined}
            placedPoint={phase === 'city' && !placeComplete ? activeCityDraft : undefined}
            traces={[...revealedTraces, ...submittedTraces]}
            visible={board.visibleSegments}
            width={board.width}
          />
        </View>
        {(phase === 'reveal' || (phase === 'city' && placeComplete)) && <Legend items={legendItems} />}
      </Card>

      {phase === 'reveal' && currentRecord && (
        <Card style={styles.resultsCard}>
          {currentRecord.results
            .map((result, index) => ({ result, index }))
            .sort((a, b) => b.result.score.total - a.result.score.total)
            .map(({ result, index }, rank) => (
              <View key={index} style={[styles.resultRow, rank > 0 && styles.resultRowBorder]}>
                <View style={[styles.resultDot, { backgroundColor: PLAYER_COLORS[index] }]} />
                <View style={styles.resultTexts}>
                  <Text style={styles.resultName}>{players[index]}</Text>
                  <Text style={styles.resultBreakdown}>
                    {t.contourGame.traceLabel} {formatNumber(result.score.tracePoints)} · {t.contourGame.cityLabel}{' '}
                    {formatNumber(result.score.cityPoints)}
                  </Text>
                </View>
                <Text style={styles.resultPoints}>
                  {formatNumber(result.score.total)} {t.common.pts}
                </Text>
              </View>
            ))}
        </Card>
      )}
    </Screen>
  );
};
