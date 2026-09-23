import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  DEFAULT_ORIGIN,
  INDICES_CLUE_COSTS,
  INDICES_CLUE_ORDER,
  INDICES_FLAG_COLORS_BY_COUNTRY,
  PLAYER_COLORS,
  fontSize,
  spacing,
} from '@/constants';
import { bearingDeg, distanceKm, formatNumber, playerDisplayName, resolveOrigin } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useIndicesSettings } from '@/settings';
import { useTheme, useThemedStyles } from '@/themes';
import type { IndicesClueId, Origin, Theme } from '@/types';

import IndicesClueCard from '../IndicesClueCard';
import PlayerTabs from '../PlayerTabs';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RoundProgress from '../ui/RoundProgress';
import Screen from '../ui/Screen';
import { maxRoundScore, nameSkeleton, normalizePlaceGuess, randomIndicesPlace, scoreForRevealed } from './helpers';
import type { IndicesGameScreenProps } from './types';

const createStyles = ({ colors, typography }: Theme) =>
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
      backgroundColor: colors.background,
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
      gap: spacing.md,
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
    buzzPanel: {
      gap: spacing.sm + 2,
    },
    buzzTitle: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'center',
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
  });

export const IndicesGameScreen = ({ onQuit }: IndicesGameScreenProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const { settings } = useIndicesSettings();
  const players = settings.playerNames.map((name, index) => playerDisplayName(name, index));
  const playerTabs = players.map((name, index) => ({ color: PLAYER_COLORS[index], name }));
  const playerOrder = players.map((_, index) => index);
  const noneAnswered = players.map(() => false);

  // Point de depart pour les indices "cap"/"distance" : position de l'appareil si accordee, sinon
  // Paris (meme comportement que Boussole). Pas de reglage dedie pour l'instant, et le nom de
  // l'origine n'est jamais affiche ici (contrairement a Boussole), donc pas besoin de traduction.
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

  const [place, setPlace] = useState(() => randomIndicesPlace(settings.difficulty));
  const bearing = bearingDeg(origin.coordinates, place.coordinates);
  const distance = distanceKm(origin.coordinates, place.coordinates);

  const [revealedClueIds, setRevealedClueIds] = useState<IndicesClueId[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [buzzedIndex, setBuzzedIndex] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);
  const [guessText, setGuessText] = useState('');
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | 'giveUp' | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [finished, setFinished] = useState(false);
  // Cumul par joueur sur toute la partie (plusieurs manches) : si quelqu'un trouve, lui seul est
  // credite ; sinon (mauvaise reponse ou abandon), tout le monde prend la meme penalite (voir
  // `settle`/`giveUp`).
  const [playerTotals, setPlayerTotals] = useState<number[]>(() => players.map(() => 0));

  const roundOver = verdict !== null;
  const isLastRound = roundNumber >= settings.rounds;
  // Score qui MONTE a chaque indice choisi (plus il est facile, plus il coute cher) : c'est celui
  // qui a le score le plus BAS qui gagne, pas le plus haut.
  const score = scoreForRevealed(revealedClueIds);
  // Le drapeau se devoile couleur par couleur : le nombre de couleurs varie selon le pays (2 ou 3
  // en general, voir INDICES_FLAG_COLORS_BY_COUNTRY) — necessaire ici pour `worstScore` aussi.
  const flagColors = INDICES_FLAG_COLORS_BY_COUNTRY[place.country];
  // Penalite si personne ne trouve (mauvaise reponse ou abandon) : le pire score qu'on aurait eu en
  // revelant vraiment tous les indices, applique a tout le monde (voir `settle`/`giveUp`) — plutot
  // que le score partiel deja revele, qui recompenserait injustement un abandon precoce.
  const worstScore = maxRoundScore(flagColors.length);
  const finalScore = verdict === 'correct' ? score : worstScore;
  const displayScore = roundOver ? finalScore : score;

  // Recap "M _ _ _" du nom au-dessus des boutons buzz/abandon, quel que soit l'ordre dans lequel
  // "Lettres" / "Nombre de mots" / "Premiere lettre" sont reveles : "Lettres" ou "Nombre de mots"
  // donnent la longueur reelle (donc les cases cachees), "Premiere lettre" devoile la 1ere lettre —
  // si elle seule est connue, on n'affiche qu'elle, aucune case cachee (longueur encore inconnue).
  const knowsWordCount = revealedClueIds.includes('wordCount');
  const knowsLength = revealedClueIds.includes('letterCount') || knowsWordCount;
  const knowsFirstLetter = revealedClueIds.includes('firstLetter');
  const skeletonGroups =
    knowsLength || knowsFirstLetter
      ? nameSkeleton(place.name, {
          groupByWord: knowsWordCount,
          revealFirst: knowsFirstLetter,
          includeHidden: knowsLength,
        })
      : [];

  // L'emoji se devoile en 3 fois (place.emojis est un triplet) : chaque clic supplementaire sur la
  // carte deja revelee compte comme un nouvel indice choisi (cout + tour), jusqu'a epuisement.
  const emojiStage = revealedClueIds.filter((id) => id === 'emoji').length;
  const flagStage = revealedClueIds.filter((id) => id === 'flagColors').length;
  // Meme principe : le cap+distance s'affiche des le 1er choix, mais la valeur en km reste cachee
  // ("?" au milieu) jusqu'a un 2e clic, qui compte donc comme un indice choisi de plus.
  const distanceStage = revealedClueIds.filter((id) => id === 'distance').length;

  // Tous les garde-fous (manche terminee, indice deja revele, emoji/drapeau epuises) sont assures
  // en amont par `IndicesClueCard` : `onPress` n'est fourni que si la carte est reellement
  // pickable (voir `moreToReveal` plus bas et `onPress={roundOver ? undefined : ...}`).
  const pickClue = (clueId: IndicesClueId) => {
    setRevealedClueIds((ids) => [...ids, clueId]);
    setTurnIndex((index) => (index + 1) % players.length);
  };

  // Boutons "J'ai trouve"/"Je ne sais pas" uniquement rendus hors manche terminee (voir le footer
  // plus bas) : pas besoin de re-verifier `roundOver` ici.
  const openBuzz = () => {
    setBuzzOpen(true);
    setVerified(false);
    setGuessText('');
    // "Celui qui a choisi" : forcement le joueur dont c'est le tour, pas de choix a faire.
    setBuzzedIndex(settings.buzzerMode === 'turnPlayer' ? turnIndex : null);
  };

  const verify = () => setVerified(true);

  // Appele uniquement une fois `buzzedIndex` connu (voir les points d'appel : bouton Verifier et
  // `submitGuess`, tous deux gardes par `buzzedIndex !== null` en amont).
  const settle = (correct: boolean) => {
    if (correct) {
      // Seul celui qui a trouve voit son total bouger, du cout reel des indices revelees.
      setPlayerTotals((totals) => totals.map((total, index) => (index === buzzedIndex ? total + score : total)));
    } else {
      // Personne n'a trouve : tout le monde prend la penalite max, pas seulement celui qui a buzze.
      setPlayerTotals((totals) => totals.map((total) => total + worstScore));
    }
    setVerdict(correct ? 'correct' : 'wrong');
    setBuzzOpen(false);
  };

  // Le bouton Valider n'est rendu qu'une fois `buzzedIndex` connu (typage force la comparaison).
  const submitGuess = () => {
    settle(normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name));
  };

  const giveUp = () => {
    // Meme penalite que pour une mauvaise reponse : abandonner ne doit pas couter moins cher.
    setPlayerTotals((totals) => totals.map((total) => total + worstScore));
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
    setPlace(randomIndicesPlace(settings.difficulty));
    setRevealedClueIds([]);
    setTurnIndex(0);
    setBuzzOpen(false);
    setBuzzedIndex(null);
    setVerified(false);
    setGuessText('');
    setVerdict(null);
  };

  const buzzedName = buzzedIndex !== null ? players[buzzedIndex] : undefined;

  if (finished) {
    // Toujours au moins 1 joueur (MIN_PLAYERS = 1) : `standings` n'est jamais vide.
    const standings = players
      .map((name, index) => ({ name, total: playerTotals[index] }))
      .sort((a, b) => a.total - b.total);
    const lowest = standings[0].total;
    const winners = standings.filter((entry) => entry.total === lowest).map((entry) => entry.name);

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

  return (
    <Screen
      footer={
        roundOver ? (
          <View style={styles.actions}>
            <Text style={[styles.resultBanner, verdict === 'correct' ? styles.resultCorrect : styles.resultWrong]}>
              {/* buzzedName est toujours defini pour 'correct'/'wrong' (settle exige buzzedIndex connu). */}
              {verdict === 'correct'
                ? t.indicesGame.scored(buzzedName!, formatNumber(finalScore))
                : verdict === 'wrong'
                  ? t.indicesGame.missed(buzzedName!, formatNumber(finalScore))
                  : t.indicesGame.noOneFound(formatNumber(finalScore))}
            </Text>
            <Text style={styles.revealAnswer}>
              {t.indicesGame.wasPlace} {place.name}
              <Text style={styles.revealSub}>
                {'\n'}
                {place.country}
              </Text>
            </Text>
            <Button label={isLastRound ? t.game.last : t.indicesGame.continueLabel} onPress={continueRound} />
            <Button label={t.indicesGame.home} onPress={onQuit} variant="ghost" />
          </View>
        ) : buzzOpen ? (
          <View style={styles.buzzPanel}>
            <Text style={styles.buzzTitle}>
              {buzzedName === undefined
                ? t.indicesGame.whoBuzzes
                : settings.answerMethod === 'typed'
                  ? t.indicesGame.buzzedPromptTyped(buzzedName)
                  : t.indicesGame.buzzedPrompt(buzzedName)}
            </Text>
            {settings.buzzerMode === 'anyone' && (
              <PlayerTabs
                activeIndex={buzzedIndex ?? -1}
                allowRevision
                answered={noneAnswered}
                onSelect={setBuzzedIndex}
                order={playerOrder}
                players={playerTabs}
              />
            )}
            {buzzedIndex !== null && settings.answerMethod === 'typed' && (
              <>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={setGuessText}
                  onSubmitEditing={submitGuess}
                  placeholder={t.indicesGame.guessPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  style={styles.guessInput}
                  value={guessText}
                />
                <Button
                  disabled={guessText.trim().length === 0}
                  label={t.indicesGame.submitGuess}
                  onPress={submitGuess}
                />
              </>
            )}
            {buzzedIndex !== null && settings.answerMethod === 'spoken' && !verified && (
              <Button label={t.indicesGame.verify} onPress={verify} />
            )}
            {verified && settings.answerMethod === 'spoken' && (
              <>
                <Text style={styles.revealAnswer}>
                  {t.indicesGame.wasPlace} {place.name}
                  <Text style={styles.revealSub}>
                    {'\n'}
                    {place.country}
                  </Text>
                </Text>
                <View style={styles.verdictRow}>
                  <Pressable accessibilityRole="button" onPress={() => settle(true)} style={styles.verdictBtn}>
                    <Text style={styles.verdictLabelCorrect}>{t.indicesGame.correct}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => settle(false)} style={styles.verdictBtn}>
                    <Text style={styles.verdictLabelWrong}>{t.indicesGame.wrong}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.buzzRow}>
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
            <Button label={t.indicesGame.buzz} onPress={openBuzz} variant="ghost" />
            <Button label={t.indicesGame.giveUp} onPress={giveUp} variant="ghost" />
          </View>
        )
      }
      header={
        <View style={styles.header}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onQuit}>
              <Text style={styles.quit}>{t.game.quit}</Text>
            </Pressable>
            <Text style={styles.score}>
              {players.length > 1 && !roundOver ? `${players[turnIndex]} · ` : ''}
              {formatNumber(displayScore)} {t.common.pts}
            </Text>
          </View>
          <RoundProgress roundNumber={roundNumber} totalRounds={settings.rounds} />
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
      {roundOver && <Text style={styles.hint}>{t.indicesGame.roundOver}</Text>}

      <Card>
        <View style={styles.clueGrid}>
          {INDICES_CLUE_ORDER.map((clueId) => {
            // A la revelation, tout s'affiche, meme les indices jamais choisis pendant la manche.
            const revealed = roundOver || revealedClueIds.includes(clueId);
            const isEmoji = clueId === 'emoji';
            const isFlag = clueId === 'flagColors';
            const isDistance = clueId === 'distance';
            const moreToReveal =
              (isEmoji && !roundOver && emojiStage < 3) ||
              (isFlag && !roundOver && flagStage < flagColors.length) ||
              (isDistance && !roundOver && distanceStage < 2);
            return (
              <IndicesClueCard
                bearingDeg={bearing}
                clueId={clueId}
                cost={INDICES_CLUE_COSTS[clueId]}
                distanceKm={distance}
                distanceStage={isDistance ? (roundOver ? 2 : distanceStage) : undefined}
                emojiStage={isEmoji ? (roundOver ? 3 : emojiStage) : undefined}
                flagStage={isFlag ? (roundOver ? flagColors.length : flagStage) : undefined}
                key={clueId}
                label={t.indicesGame.clues[clueId]}
                moreToReveal={moreToReveal}
                onPress={roundOver ? undefined : () => pickClue(clueId)}
                place={place}
                state={revealed ? 'revealed' : 'locked'}
              />
            );
          })}
        </View>
      </Card>
    </Screen>
  );
};
