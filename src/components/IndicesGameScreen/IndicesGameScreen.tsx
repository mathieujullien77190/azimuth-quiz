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
import Screen from '../ui/Screen';
import { normalizePlaceGuess, randomIndicesPlace, scoreForRevealed } from './helpers';
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
      paddingBottom: spacing.sm,
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
  // Cumul par joueur sur toute la partie (plusieurs manches) : seul celui qui buzze sur une manche
  // voit son total bouge, dans un sens ou dans l'autre (voir settle).
  const [playerTotals, setPlayerTotals] = useState<number[]>(() => players.map(() => 0));

  const roundOver = verdict !== null;
  const isLastRound = roundNumber >= settings.rounds;
  // Score qui MONTE a chaque indice choisi (plus il est facile, plus il coute cher) : c'est celui
  // qui a le score le plus BAS qui gagne, pas le plus haut.
  const score = scoreForRevealed(revealedClueIds);
  // Une mauvaise reponse coute 1 point de plus ; abandonner ("Je ne sais pas") garde le score deja
  // accumule tel quel, sans penalite ni remise a zero supplementaire.
  const finalScore = verdict === 'wrong' ? score + 1 : score;
  const displayScore = roundOver ? finalScore : score;

  // L'emoji se devoile en 3 fois (place.emojis est un triplet) : chaque clic supplementaire sur la
  // carte deja revelee compte comme un nouvel indice choisi (cout + tour), jusqu'a epuisement.
  const emojiStage = revealedClueIds.filter((id) => id === 'emoji').length;
  // Le drapeau se devoile couleur par couleur, meme principe que l'emoji : le nombre de couleurs
  // varie selon le pays (2 ou 3 en general, voir INDICES_FLAG_COLORS_BY_COUNTRY).
  const flagColors = INDICES_FLAG_COLORS_BY_COUNTRY[place.country];
  const flagStage = revealedClueIds.filter((id) => id === 'flagColors').length;

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
    // Le joueur qui buzze voit son total bouger du montant de la manche : en bien si trouve, en
    // mal (+1) si rate. Personne d'autre n'est touche.
    const awarded = correct ? score : score + 1;
    setPlayerTotals((totals) => totals.map((total, index) => (index === buzzedIndex ? total + awarded : total)));
    setVerdict(correct ? 'correct' : 'wrong');
    setBuzzOpen(false);
  };

  // Le bouton Valider n'est rendu qu'une fois `buzzedIndex` connu (typage force la comparaison).
  const submitGuess = () => {
    settle(normalizePlaceGuess(guessText) === normalizePlaceGuess(place.name));
  };

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
              {formatNumber(displayScore)} {t.common.pts}
            </Text>
          </View>
          <PlayerTabs
            activeIndex={roundOver ? -1 : turnIndex}
            allowRevision
            answered={noneAnswered}
            onSelect={() => {}}
            order={playerOrder}
            players={playerTabs}
          />
        </View>
      }
    >
      <Text style={styles.hint}>
        {roundOver ? t.indicesGame.roundOver : t.indicesGame.turnHint(players[turnIndex])} · {t.game.round}{' '}
        {roundNumber}/{settings.rounds}
      </Text>

      <Card>
        <View style={styles.clueGrid}>
          {INDICES_CLUE_ORDER.map((clueId) => {
            // A la revelation, tout s'affiche, meme les indices jamais choisis pendant la manche.
            const revealed = roundOver || revealedClueIds.includes(clueId);
            const isEmoji = clueId === 'emoji';
            const isFlag = clueId === 'flagColors';
            const moreToReveal =
              (isEmoji && !roundOver && emojiStage < 3) || (isFlag && !roundOver && flagStage < flagColors.length);
            return (
              <IndicesClueCard
                bearingDeg={bearing}
                clueId={clueId}
                cost={INDICES_CLUE_COSTS[clueId]}
                distanceKm={distance}
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
