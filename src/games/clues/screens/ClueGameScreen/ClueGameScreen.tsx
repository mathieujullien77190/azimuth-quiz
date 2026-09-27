import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DEFAULT_ORIGIN, PLAYER_COLORS } from '@/data';
import { bearingDeg, distanceKm, formatNumber, nameSkeleton, playerDisplayName, resolveOrigin } from '@/helpers';
import { CLUE_ORDER } from '@/games/clues/constants';
import { getCachedClueHistory, recordClueDraw } from '@/games/clues/helpers/clueHistory';
import { useLanguage, useTranslation } from '@/i18n';
import { useClueSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { ClueId, Origin } from '@/types';

import ClueCard from '../../components/ClueCard';
import PlayerTabs from '@/components/PlayerTabs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import NoOneFoundText from '@/components/ui/NoOneFoundText';
import RoundProgress from '@/components/RoundProgress';
import Screen from '@/components/ui/Screen';
import { WRONG_ANSWER_PENALTY } from './constants';
import {
  maxScoreForRound,
  normalizePlaceGuess,
  overlayTypedLetters,
  randomCluePlace,
  skeletonLetterCount,
  totalRevealCount,
} from './helpers';
import type { ClueGameScreenProps } from './types';

import { createStyles } from './styles';

export const ClueGameScreen = ({ onQuit }: ClueGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { language } = useLanguage();
  const { settings } = useClueSettings();
  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const playerOrder = players.map((_, index) => index);
  const noneAnswered = players.map(() => false);

  // Starting point for the "heading"/"distance" clues: device position if granted, otherwise
  // Paris (same behavior as Compass). No dedicated setting for now, and the origin's
  // name is never shown here (unlike Compass), so no need for translation.
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
    const drawn = randomCluePlace(settings.difficulty, settings.categories, language, getCachedClueHistory() ?? {});
    recordClueDraw(drawn);
    return drawn;
  });
  const bearing = bearingDeg(origin.coordinates, place.coordinates);
  const distance = distanceKm(origin.coordinates, place.coordinates);

  const [revealedClueIds, setRevealedClueIds] = useState<ClueId[]>(() =>
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
  const vowelsUnlocked = CLUE_ORDER.every((id) => revealedClueIds.includes(id));

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
  // upstream by `ClueCard`: `onPress` is only provided if the card is genuinely
  // pickable (see `moreToReveal` below and `onPress={roundOver ? undefined : ...}`).
  const pickClue = (clueId: ClueId) => {
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
    // Never null here (unlike the initial draw above): recordClueDraw already populated the
    // module-level cache synchronously for this very place pool, on mount, before any round
    // could finish and reach this point.
    const nextPlace = randomCluePlace(settings.difficulty, settings.categories, language, getCachedClueHistory()!);
    recordClueDraw(nextPlace);
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
        <Text style={styles.title}>{t.cluesGame.finalScoreTitle}</Text>
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
        <Button label={t.cluesGame.home} onPress={onQuit} />
      </Screen>
    );
  }

  const screen = (
    <Screen
      footer={
        <View style={styles.footerContent}>
          {!roundOver && <Text style={styles.pointsAtStake}>{t.cluesGame.pointsAtStake(formatNumber(remaining))}</Text>}
          {roundOver ? (
            <View style={styles.actions}>
              <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
                {/* buzzedName is always defined for 'correct'/'wrong' (settle requires buzzedIndex
                    to be known). */}
                {verdict === 'correct' ? (
                  t.cluesGame.scored(buzzedName!, formatNumber(remaining))
                ) : verdict === 'wrong' ? (
                  t.cluesGame.missed(buzzedName!, formatNumber(WRONG_ANSWER_PENALTY))
                ) : (
                  <NoOneFoundText players={players} />
                )}
              </Text>
              <Text style={styles.revealAnswer}>
                {t.cluesGame.wasPlace} {place.name}
                <Text style={styles.revealSub}>
                  {'\n'}
                  {place.country}
                </Text>
              </Text>
              <Button label={isLastRound ? t.game.last : t.cluesGame.continueLabel} onPress={continueRound} />
            </View>
          ) : settings.answerMethod === 'spoken' && buzzedIndex !== null ? (
            <View style={styles.buzzPanel}>
              <View style={styles.buzzerBadge}>
                <View style={[styles.buzzerBadgeDot, { backgroundColor: PLAYER_COLORS[buzzedIndex] }]} />
                <Text style={styles.buzzerBadgeText}>{t.cluesGame.buzzedPrompt(buzzedName!)}</Text>
              </View>
              {!verified && (
                <>
                  <Button label={t.cluesGame.verify} onPress={verify} />
                  <Button label={t.cluesGame.cancel} onPress={cancelBuzz} variant="ghost" />
                </>
              )}
              {verified && (
                <>
                  <Text style={styles.revealAnswer}>
                    {t.cluesGame.wasPlace} {place.name}
                    <Text style={styles.revealSub}>
                      {'\n'}
                      {place.country}
                    </Text>
                  </Text>
                  <View style={styles.verdictRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => settle(true, buzzedIndex)}
                      style={styles.verdictBtn}
                    >
                      <Text style={styles.verdictLabelCorrect}>{t.cluesGame.correct}</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => settle(false, buzzedIndex)}
                      style={styles.verdictBtn}
                    >
                      <Text style={styles.verdictLabelWrong}>{t.cluesGame.wrong}</Text>
                    </Pressable>
                  </View>
                  <Button label={t.cluesGame.cancel} onPress={cancelBuzz} variant="ghost" />
                </>
              )}
            </View>
          ) : settings.answerMethod === 'spoken' ? (
            <View style={styles.buzzRow}>
              {lastWrong !== null && (
                <Text style={[styles.resultBanner, styles.resultWrong]}>
                  {t.cluesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
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
                <Button label={t.cluesGame.buzz} onPress={openBuzz} variant="ghost" />
              )}
              <Button label={t.cluesGame.giveUp} onPress={giveUp} variant="ghost" />
            </View>
          ) : (
            // Typed mode: input + "Valider" always visible, no buzz-first step — see
            // `validateGuess`/`attributeGuess` (the full-screen overlay lives outside `Screen`,
            // see the bottom of this component's return).
            <View style={styles.buzzRow}>
              {lastWrong !== null && (
                <Text style={[styles.resultBanner, styles.resultWrong]}>
                  {t.cluesGame.missed(lastWrong, formatNumber(WRONG_ANSWER_PENALTY))}
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
                placeholder={t.cluesGame.guessPlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.guessInput}
                value={guessText}
              />
              {guessText.trim().length === 0 ? (
                <Button label={t.cluesGame.giveUp} onPress={giveUp} variant="ghost" />
              ) : (
                <Button label={t.cluesGame.submitGuess} onPress={validateGuess} />
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
            answered={noneAnswered}
            order={playerOrder}
            players={playerTabs}
          />
        </View>
      }
    >
      <Card>
        <View style={styles.clueGrid}>
          {CLUE_ORDER.map((clueId) => {
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
            // — 1 color, then every color, then the actual flag (see ClueCard).
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
              <ClueCard
                bearingDeg={bearing}
                clueId={clueId}
                currencyStage={isCurrency ? (roundOver ? 2 : currencyStage) : undefined}
                distanceKm={distance}
                distanceStage={isDistance ? (roundOver ? 2 : distanceStage) : undefined}
                elevationStage={isElevation ? (roundOver ? 2 : elevationStage) : undefined}
                emojiStage={isEmoji ? (roundOver ? 3 : emojiStage) : undefined}
                flagStage={isFlag ? (roundOver ? flagMaxStage : flagStage) : undefined}
                key={clueId}
                label={t.cluesGame.clues[clueId]}
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
            <ClueCard
              clueId="vowels"
              key="vowels"
              label={t.cluesGame.clues.vowels}
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
          {pendingCorrect && <Text style={[styles.resultBanner, styles.resultCorrect]}>{t.cluesGame.resultOk}</Text>}
          <Text style={styles.attributePrompt}>{t.cluesGame.whoAnswered}</Text>
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
