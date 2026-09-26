import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_ORIGIN, INDICES_CLUE_ORDER, PLAYER_COLORS, fontSize, spacing } from '@/constants';
import { bearingDeg, distanceKm, formatNumber, nameSkeleton, playerDisplayName, resolveOrigin } from '@/helpers';
import { getCachedIndicesHistory, recordIndicesDraw } from '@/helpers/indicesHistory';
import { useLanguage, useTranslation } from '@/i18n';
import { useIndicesSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { IndicesClueId, Origin, Theme } from '@/types';

import IndicesClueCard from '../IndicesClueCard';
import PlayerTabs from '../PlayerTabs';
import Button from '../ui/Button';
import Card from '../ui/Card';
import NoOneFoundText from '../ui/NoOneFoundText';
import RoundProgress from '../ui/RoundProgress';
import Screen from '../ui/Screen';
import { WRONG_ANSWER_PENALTY } from './constants';
import {
  maxScoreForRound,
  normalizePlaceGuess,
  overlayTypedLetters,
  randomIndicesPlace,
  skeletonLetterCount,
  totalRevealCount,
} from './helpers';
import type { IndicesGameScreenProps } from './types';

const createStyles = ({ colors, isDark, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
      textAlign: 'center',
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
    header: {
      // White by day rather than the page's own light-blue background (see Screen's footer,
      // same fix): a fixed bar reads better as its own surface than a washed-out page extension.
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
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    clueGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    skeletonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: spacing.xl,
      marginBottom: spacing.md,
    },
    skeletonWord: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    skeletonSlot: {
      width: 18,
      height: 26,
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    skeletonLetter: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.subtitle,
    },
    // Typed-in letters (not revealed by any clue) stand out from clue-revealed ones by color
    // alone, same size — see the live overlay above the typed-answer input.
    skeletonLetterTyped: {
      ...typography.display,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    buzzPanel: {
      gap: spacing.sm + 2,
    },
    buzzTitle: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    // The round's own live/countdown score (see `remaining`): distinct from the top-right
    // header, which now shows each player's real cumulative total instead.
    pointsAtStake: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
    },
    // Same 10px gap as buzzPanel (spacing.sm + 2), for even spacing between the footer's own
    // top-level elements (points-at-stake text, then the actions/buzz panel/result banner).
    footerContent: {
      gap: spacing.sm + 2,
    },
    // Same pill look as the active tab in PlayerTabs (see its `active`/`labelActive` styles):
    // reads as "this is the player who's currently doing something", same as up there.
    buzzerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      backgroundColor: colors.accent,
    },
    buzzerBadgeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    buzzerBadgeText: {
      ...typography.heading,
      color: colors.onAccent,
      fontSize: fontSize.body - 1,
    },
    verdictRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    verdictBtn: {
      flex: 1,
      paddingVertical: spacing.sm + 3,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
    },
    verdictLabelCorrect: {
      ...typography.heading,
      color: colors.success,
      fontSize: fontSize.body,
    },
    verdictLabelWrong: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.body,
    },
    resultBanner: {
      ...typography.heading,
      textAlign: 'center',
      fontSize: fontSize.caption + 1,
    },
    resultCorrect: {
      color: colors.success,
    },
    resultWrong: {
      color: colors.danger,
    },
    revealAnswer: {
      ...typography.heading,
      textAlign: 'center',
      color: colors.text,
      fontSize: fontSize.body,
    },
    revealSub: {
      ...typography.body,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: fontSize.caption,
      marginTop: 2,
    },
    actions: {
      gap: spacing.sm,
    },
    buzzRow: {
      gap: spacing.sm,
    },
    guessInput: {
      ...typography.heading,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Typed mode's post-"Valider" step: covers the entire screen (see the component's own
    // return, rendered as a sibling of `Screen` rather than inside its footer). Mostly opaque
    // (hex alpha suffix, same trick as ContourGameScreen's own overlays), just enough transparency
    // to hint the board/round is still there behind it.
    attributeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${colors.background}E6`,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.lg,
    },
    attributePrompt: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
    attributeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    attributeButton: {
      minWidth: 110,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.button,
      borderWidth: 2,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
    },
    attributeButtonText: {
      ...typography.heading,
      color: colors.text,
      fontSize: fontSize.subtitle,
    },
  });

export const IndicesGameScreen = ({ onQuit }: IndicesGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { language } = useLanguage();
  const { settings } = useIndicesSettings();
  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const playerOrder = players.map((_, index) => index);
  const noneAnswered = players.map(() => false);

  // Starting point for the "heading"/"distance" clues: device position if granted, otherwise
  // Paris (same behavior as Boussole). No dedicated setting for now, and the origin's
  // name is never shown here (unlike Boussole), so no need for translation.
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  useEffect(() => {
    let cancelled = false;
    resolveOrigin('device').then((resolved) => {
      if (!cancelled) setOrigin(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [place, setPlace] = useState(() => {
    const drawn = randomIndicesPlace(
      settings.difficulty,
      settings.categories,
      language,
      getCachedIndicesHistory() ?? {},
    );
    recordIndicesDraw(drawn);
    return drawn;
  });
  const bearing = bearingDeg(origin.coordinates, place.coordinates);
  const distance = distanceKm(origin.coordinates, place.coordinates);

  const [revealedClueIds, setRevealedClueIds] = useState<IndicesClueId[]>(() =>
    settings.startWithFirstLetter ? ['letter'] : [],
  );
  const [turnIndex, setTurnIndex] = useState(0);
  // Spoken mode only (see the footer below): who buzzed, picked before anyone speaks — typed
  // mode no longer buzzes first, see `pendingCorrect`.
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [buzzedIndex, setBuzzedIndex] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [guessText, setGuessText] = useState('');
  // Typed mode only: set the moment "Valider" is pressed (before anyone's identified) to whether
  // the typed text matched — the full-screen overlay below then asks who answered, and
  // `attributeGuess` finishes the job `settle` used to do right away in the old buzz-first flow.
  const [pendingCorrect, setPendingCorrect] = useState<boolean | null>(null);
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | 'giveUp' | null>(null);
  const [lastWrong, setLastWrong] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [finished, setFinished] = useState(false);
  // Cumulative per player across the whole game (several rounds): only whoever buzzes sees their
  // total move, up if they find it (the round's remaining score) or down if they're wrong
  // (`WRONG_ANSWER_PENALTY`) — giving up costs nobody anything (see `settle`/`giveUp`).
  const [playerTotals, setPlayerTotals] = useState<number[]>(() => players.map(() => 0));

  const roundOver = verdict !== null;
  const isLastRound = roundNumber >= settings.rounds;
  // Round score: a countdown, not a cost accumulator. Starts from a round number (the
  // total number of possible clues rounded up to the nearest ten, e.g. 26 -> 30) and goes down by
  // 1 for each clue picked, all clues combined (no more difficulty tiers). Finding it fast
  // (few clues used) thus leaves a high remaining score — that's what the finder wins
  // (see `settle`).
  const maxScore = maxScoreForRound(totalRevealCount());
  // `vowels` isn't a normal clue (see its own doc comment in types/index.ts): it's excluded from
  // the linear countdown and instead drops the round straight to 1, if it was still above that.
  const vowelsRevealed = revealedClueIds.includes('vowels');
  const countdownRemaining = maxScore - revealedClueIds.filter((id) => id !== 'vowels').length;
  const remaining = vowelsRevealed ? Math.min(countdownRemaining, 1) : countdownRemaining;
  // `vowels` only appears once every other clue has been picked at least once.
  const vowelsUnlocked = INDICES_CLUE_ORDER.every((id) => revealedClueIds.includes(id));

  // The emoji reveals in 3 steps (place.emojis is a triplet): each extra click on the
  // already-revealed card counts as a newly picked clue (cost + turn), until exhausted.
  const emojiStage = revealedClueIds.filter((id) => id === 'emoji').length;
  const flagStage = revealedClueIds.filter((id) => id === 'flagColors').length;
  // Same idea: the heading+distance shows from the 1st pick, but the km value stays hidden
  // ("?" in the middle) until a 2nd click, which thus counts as one more picked clue.
  const distanceStage = revealedClueIds.filter((id) => id === 'distance').length;
  // Same idea again: tiered emoji (elevation/population) or symbol/day-night (currency/local
  // time) on the 1st click, exact value on the 2nd.
  const elevationStage = revealedClueIds.filter((id) => id === 'elevation').length;
  const populationStage = revealedClueIds.filter((id) => id === 'population').length;
  const currencyStage = revealedClueIds.filter((id) => id === 'currency').length;
  const localTimeStage = revealedClueIds.filter((id) => id === 'localTime').length;
  // "letter" reveals in 2 clicks: 1st the first letter alone, 2nd every letter's slot with the
  // real per-word length.
  const letterStage = revealedClueIds.filter((id) => id === 'letter').length;

  // "M _ _ _" name recap above the buzz/give-up buttons: nothing shown until "letter" has
  // been picked at least once. `lengthKnown` also gates the live-typing overlay/cap below the
  // typed-answer input (see `overlayTypedLetters`/`skeletonLetterCount`): both need the real
  // per-word length.
  const skeletonLengthKnown = letterStage >= 2 || vowelsRevealed;
  const skeletonGroups =
    letterStage >= 1
      ? nameSkeleton(place.name, {
          groupByWord: letterStage >= 2 || vowelsRevealed,
          lengthKnown: skeletonLengthKnown,
          revealVowels: vowelsRevealed,
        })
      : [];

  // All the guards (round over, clue already revealed, emoji/flag exhausted) are enforced
  // upstream by `IndicesClueCard`: `onPress` is only provided if the card is genuinely
  // pickable (see `moreToReveal` below and `onPress={roundOver ? undefined : ...}`).
  const pickClue = (clueId: IndicesClueId) => {
    setRevealedClueIds((ids) => [...ids, clueId]);
    setTurnIndex((index) => (index + 1) % players.length);
    setLastWrong(null);
  };

  // Spoken mode only: "J'ai trouvé" opens the buzz-first player picker (there's no text to type,
  // so identifying who's about to answer out loud has to come before the verdict). Typed mode
  // never buzzes first any more — see `validateGuess`/`attributeGuess` below. Deliberately
  // doesn't touch `lastWrong`: the previous miss stays visible while the next player picks
  // themselves.
  const openBuzz = () => {
    setBuzzOpen(true);
    setVerified(false);
    setBuzzedIndex(null);
  };

  const verify = () => setVerified(true);

  // Fallback if the buzz was a mistake (wrong player, accidental click...): closes the panel
  // without touching the score, as if nobody had buzzed.
  const cancelBuzz = () => {
    setBuzzOpen(false);
    setVerified(false);
    setBuzzedIndex(null);
  };

  // Shared by both answer methods once a player is finally known: spoken mode knows it from the
  // buzz-first pick (`buzzedIndex`), typed mode only from the post-"Valider" attribution overlay
  // (`attributeGuess`) — hence taking `index` as a plain argument instead of reading state.
  const settle = (correct: boolean, index: number) => {
    // Only whoever answered sees their total move: the remaining score if they found it, a fixed
    // penalty if they were wrong (otherwise answering at random would be risk-free).
    const delta = correct ? remaining : -WRONG_ANSWER_PENALTY;
    setPlayerTotals((totals) => totals.map((total, i) => (i === index ? total + delta : total)));
    if (correct) {
      setBuzzedIndex(index);
      setVerdict('correct');
      setBuzzOpen(false);
      return;
    }
    // Spoken mode already reveals the place on "Vérifier" (see the `verified` block below), so
    // there's nothing left to hide once someone's wrong there — ending the round avoids
    // pretending it's still a mystery everyone in the room just saw spelled out.
    if (settings.answerMethod === 'spoken') {
      setBuzzedIndex(index);
      setVerdict('wrong');
      setBuzzOpen(false);
      return;
    }
    // Typed mode never reveals the answer on a miss (just "that's not it"): the round stays
    // open so anyone (including them again) can type and try.
    setLastWrong(players[index]);
    setBuzzOpen(false);
    setVerified(false);
    setBuzzedIndex(null);
    setGuessText('');
  };

  // Typed mode's "Valider": checks the typed text immediately (nobody's identity involved yet).
  // Solo play has only one possible answerer, so it settles right away instead of opening the
  // full-screen "who answered" overlay (`pendingCorrect`) — that overlay only makes sense once
  // there's an actual choice to make, see `attributeGuess`.
  const validateGuess = () => {
    const correct = normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name);
    if (players.length === 1) {
      settle(correct, 0);
      return;
    }
    setPendingCorrect(correct);
  };

  // Resolves the overlay once a player's picked as who answered.
  const attributeGuess = (index: number) => {
    settle(pendingCorrect as boolean, index);
    setPendingCorrect(null);
  };

  // Giving up costs nobody anything (0 points): neither the gain of a right answer, nor the
  // penalty of a wrong one — just skips the round.
  const giveUp = () => {
    setVerdict('giveUp');
    setBuzzOpen(false);
    setBuzzedIndex(null);
  };

  const continueRound = () => {
    if (isLastRound) {
      setFinished(true);
      return;
    }
    setRoundNumber((n) => n + 1);
    // Never null here (unlike the initial draw above): recordIndicesDraw already populated the
    // module-level cache synchronously for this very place pool, on mount, before any round
    // could finish and reach this point.
    const nextPlace = randomIndicesPlace(
      settings.difficulty,
      settings.categories,
      language,
      getCachedIndicesHistory()!,
    );
    recordIndicesDraw(nextPlace);
    setPlace(nextPlace);
    setRevealedClueIds(settings.startWithFirstLetter ? ['letter'] : []);
    setTurnIndex(0);
    setBuzzOpen(false);
    setBuzzedIndex(null);
    setVerified(false);
    setGuessText('');
    setVerdict(null);
    setLastWrong(null);
  };

  const buzzedName = buzzedIndex !== null ? players[buzzedIndex] : undefined;

  if (finished) {
    // Always at least 1 player (MIN_PLAYERS = 1): `standings` is never empty. The score is
    // now a countdown you win (see `remaining`/`settle`): the HIGHEST total
    // wins, not the lowest.
    const standings = players
      .map((name, index) => ({ name, total: playerTotals[index] }))
      .sort((a, b) => b.total - a.total);
    const highest = standings[0].total;
    const winners = standings.filter((entry) => entry.total === highest).map((entry) => entry.name);

    return (
      <Screen>
        <Text style={styles.title}>{t.indicesGame.finalScoreTitle}</Text>
        {players.length > 1 && (
          <Text style={[styles.resultBanner, styles.resultCorrect]}>
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
        <Button label={t.indicesGame.home} onPress={onQuit} />
      </Screen>
    );
  }

  const screen = (
    <Screen
      footer={
        <View style={styles.footerContent}>
          {!roundOver && (
            <Text style={styles.pointsAtStake}>{t.indicesGame.pointsAtStake(formatNumber(remaining))}</Text>
          )}
          {roundOver ? (
            <View style={styles.actions}>
              <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {/* buzzedName is always defined for 'correct'/'wrong' (settle requires buzzedIndex
                    to be known). */}
                {verdict === 'correct' ? (
                  t.indicesGame.scored(buzzedName!, formatNumber(remaining))
                ) : verdict === 'wrong' ? (
                  t.indicesGame.missed(buzzedName!, formatNumber(WRONG_ANSWER_PENALTY))
                ) : (
                  <NoOneFoundText players={players} />
                )}
              </Text>
              <Text style={styles.revealAnswer}>
                {t.indicesGame.wasPlace} {place.name}
                <Text style={styles.revealSub}>
                  {'\n'}
                  {place.country}
                </Text>
              </Text>
              <Button label={isLastRound ? t.game.last : t.indicesGame.continueLabel} onPress={continueRound} />
            </View>
          ) : settings.answerMethod === 'spoken' && buzzedIndex !== null ? (
            <View style={styles.buzzPanel}>
              <View style={styles.buzzerBadge}>
                <View style={[styles.buzzerBadgeDot, { backgroundColor: PLAYER_COLORS[buzzedIndex] }]} />
                <Text style={styles.buzzerBadgeText}>{t.indicesGame.buzzedPrompt(buzzedName!)}</Text>
              </View>
              {!verified && (
                <>
                  <Button label={t.indicesGame.verify} onPress={verify} />
                  <Button label={t.indicesGame.cancel} onPress={cancelBuzz} variant="ghost" />
                </>
              )}
              {verified && (
                <>
                  <Text style={styles.revealAnswer}>
                    {t.indicesGame.wasPlace} {place.name}
                    <Text style={styles.revealSub}>
                      {'\n'}
                      {place.country}
                    </Text>
                  </Text>
                  <View style={styles.verdictRow}>
                    <Pressable accessibilityRole="button" onPress={() => settle(true, buzzedIndex)} style={styles.verdictBtn}>
                      <Text style={styles.verdictLabelCorrect}>{t.indicesGame.correct}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => settle(false, buzzedIndex)} style={styles.verdictBtn}>
                      <Text style={styles.verdictLabelWrong}>{t.indicesGame.wrong}</Text>
                    </Pressable>
                  </View>
                  <Button label={t.indicesGame.cancel} onPress={cancelBuzz} variant="ghost" />
                </>
              )}
            </View>
          ) : settings.answerMethod === 'spoken' ? (
            <View style={styles.buzzRow}>
              {lastWrong !== null && (
                <Text style={[styles.resultBanner, styles.resultWrong]}>
                  {t.indicesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
                </Text>
              )}
              {skeletonGroups.length > 0 && (
                <View style={styles.skeletonRow}>
                  {skeletonGroups.map((group, groupIndex) => (
                    <View key={groupIndex} style={styles.skeletonWord}>
                      {group.map((letter, letterIndex) => (
                        <View key={letterIndex} style={styles.skeletonSlot}>
                          {letter !== null && <Text style={styles.skeletonLetter}>{letter}</Text>}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {buzzOpen ? (
                <PlayerTabs
                  activeIndex={-1}
                  allowRevision
                  answered={noneAnswered}
                  onSelect={setBuzzedIndex}
                  order={playerOrder}
                  players={playerTabs}
                />
              ) : (
                <Button label={t.indicesGame.buzz} onPress={openBuzz} variant="ghost" />
              )}
              <Button label={t.indicesGame.giveUp} onPress={giveUp} variant="ghost" />
            </View>
          ) : (
            // Typed mode: input + "Valider" always visible, no buzz-first step — see
            // `validateGuess`/`attributeGuess` (the full-screen overlay lives outside `Screen`,
            // see the bottom of this component's return).
            <View style={styles.buzzRow}>
              {lastWrong !== null && (
                <Text style={[styles.resultBanner, styles.resultWrong]}>
                  {t.indicesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
                </Text>
              )}
              {skeletonGroups.length > 0 && (
                <View style={styles.skeletonRow}>
                  {(skeletonLengthKnown ? overlayTypedLetters(skeletonGroups, guessText) : skeletonGroups).map(
                    (group, groupIndex) => (
                      <View key={groupIndex} style={styles.skeletonWord}>
                        {group.map((letter, letterIndex) => (
                          <View key={letterIndex} style={styles.skeletonSlot}>
                            {letter !== null && (
                              <Text
                                style={
                                  skeletonLengthKnown && skeletonGroups[groupIndex][letterIndex] === null
                                    ? styles.skeletonLetterTyped
                                    : styles.skeletonLetter
                                }
                              >
                                {letter}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ),
                  )}
                </View>
              )}
              <TextInput
                autoCapitalize="words"
                onChangeText={(next) => {
                  // Once the real length is known, block typing past it (letters only — spaces/
                  // punctuation don't count, the player may type either).
                  if (
                    skeletonLengthKnown &&
                    [...next.replace(/[^\p{L}]/gu, '')].length > skeletonLetterCount(skeletonGroups)
                  )
                    return;
                  setGuessText(next);
                }}
                onSubmitEditing={validateGuess}
                placeholder={t.indicesGame.guessPlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.guessInput}
                value={guessText}
              />
              {guessText.trim().length === 0 ? (
                <Button label={t.indicesGame.giveUp} onPress={giveUp} variant="ghost" />
              ) : (
                <Button label={t.indicesGame.submitGuess} onPress={validateGuess} />
              )}
            </View>
          )}
        </View>
      }
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>
              {players.length > 1 ? `${players[turnIndex]} · ` : ''}
              {formatNumber(playerTotals[turnIndex])} {t.common.pts}
            </Text>
          </View>
          <RoundProgress difficulties={[settings.difficulty]} roundNumber={roundNumber} totalRounds={settings.rounds} />
          <PlayerTabs
            activeIndex={roundOver ? -1 : turnIndex}
            activeLabel={t.game.playerTurn}
            allowRevision
            answered={noneAnswered}
            onSelect={() => {}}
            order={playerOrder}
            players={playerTabs}
          />
        </View>
      }
    >
      <Card>
        <View style={styles.clueGrid}>
          {INDICES_CLUE_ORDER.map((clueId) => {
            // On reveal, everything shows, even clues never picked during the round.
            const revealed = roundOver || revealedClueIds.includes(clueId);
            const isEmoji = clueId === 'emoji';
            const isFlag = clueId === 'flagColors';
            const isDistance = clueId === 'distance';
            const isElevation = clueId === 'elevation';
            const isPopulation = clueId === 'population';
            const isCurrency = clueId === 'currency';
            const isLocalTime = clueId === 'localTime';
            const isLetter = clueId === 'letter';
            // Flag: always exactly 3 clicks regardless of how many colors the flag actually has
            // — 1 color, then every color, then the actual flag (see IndicesClueCard).
            const flagMaxStage = 3;
            const moreToReveal =
              (isEmoji && !roundOver && emojiStage < 3) ||
              (isFlag && !roundOver && flagStage < flagMaxStage) ||
              (isDistance && !roundOver && distanceStage < 2) ||
              (isElevation && !roundOver && elevationStage < 2) ||
              (isPopulation && !roundOver && populationStage < 2) ||
              (isCurrency && !roundOver && currencyStage < 2) ||
              (isLocalTime && !roundOver && localTimeStage < 2) ||
              (isLetter && !roundOver && letterStage < 2);
            return (
              <IndicesClueCard
                bearingDeg={bearing}
                clueId={clueId}
                currencyStage={isCurrency ? (roundOver ? 2 : currencyStage) : undefined}
                distanceKm={distance}
                distanceStage={isDistance ? (roundOver ? 2 : distanceStage) : undefined}
                elevationStage={isElevation ? (roundOver ? 2 : elevationStage) : undefined}
                emojiStage={isEmoji ? (roundOver ? 3 : emojiStage) : undefined}
                flagStage={isFlag ? (roundOver ? flagMaxStage : flagStage) : undefined}
                key={clueId}
                label={t.indicesGame.clues[clueId]}
                letterStage={isLetter ? (roundOver ? 2 : letterStage) : undefined}
                localTimeStage={isLocalTime ? (roundOver ? 2 : localTimeStage) : undefined}
                moreToReveal={moreToReveal}
                onPress={roundOver ? undefined : () => pickClue(clueId)}
                populationStage={isPopulation ? (roundOver ? 2 : populationStage) : undefined}
                place={place}
                state={revealed ? 'revealed' : 'locked'}
              />
            );
          })}
          {vowelsUnlocked && (
            <IndicesClueCard
              clueId="vowels"
              key="vowels"
              label={t.indicesGame.clues.vowels}
              moreToReveal={false}
              onPress={roundOver ? undefined : () => pickClue('vowels')}
              place={place}
              state={roundOver || vowelsRevealed ? 'revealed' : 'locked'}
            />
          )}
        </View>
      </Card>
    </Screen>
  );

  return (
    <>
      {screen}
      {/* Typed mode's post-"Valider" step (see `validateGuess`): covers the whole screen (header
          included), not just the footer, since attributing the answer matters more right now
          than anything else on screen. */}
      {pendingCorrect !== null && (
        <View style={styles.attributeOverlay}>
          {pendingCorrect && (
            <Text style={[styles.resultBanner, styles.resultCorrect]}>{t.indicesGame.resultOk}</Text>
          )}
          <Text style={styles.attributePrompt}>{t.indicesGame.whoAnswered}</Text>
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
    </>
  );
};
