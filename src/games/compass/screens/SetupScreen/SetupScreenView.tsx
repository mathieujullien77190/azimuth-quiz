import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DIFFICULTIES, ROUND_OPTIONS, difficultyEmoji, fontSize, spacing } from '@/data';
import { CATEGORIES } from '@/games/compass/constants';
import { initials } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import ThemeBackdrop from '@/components/ThemeBackdrop';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Toggle from '@/components/ui/Toggle';
import { DISTANCE_MODES } from './constants';
import type { SetupScreenViewProps } from './types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({
    title: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      paddingTop: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    names: {
      gap: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    // Input container: positions the initials within it, never as a sibling that could
    // push the row off-screen.
    inputWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    input: {
      ...typography.heading,
      minHeight: 44,
      paddingLeft: spacing.md,
      paddingRight: 46,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
    // Same as `input`, but leaves room on the right for both the initials badge and the host's
    // remove cross next to it (see `removeButton`), instead of just the badge.
    inputWithRemove: {
      paddingRight: 78,
    },
    initials: {
      position: 'absolute',
      right: spacing.xs + 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    initialsText: {
      ...typography.label,
      fontSize: fontSize.caption,
    },
    // Sits just left of `initials` (same absolute-right positioning scheme), inside the same
    // input box, rather than as a separate element outside it.
    removeButton: {
      position: 'absolute',
      right: spacing.xs + 2 + 28 + spacing.sm,
      width: 24,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeButtonText: {
      ...typography.heading,
      color: colors.danger,
      fontSize: fontSize.body,
    },
    hint: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
    },
    // Full-screen splash (in a `Modal`, so it covers everything regardless of where in the
    // layout this renders) rather than a themed banner — a fixed near-black backdrop reads the
    // same in both themes, which a themed one wouldn't.
    noticeOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    noticeText: {
      ...typography.heading,
      color: '#FFFFFF',
      fontSize: fontSize.body,
      textAlign: 'center',
    },
    // Same "loading" convention as GameScreen/OnlineGameScreen's own early-loading screens: the
    // gap between pressing "Lancer la partie" (GPS resolution, then a Firestore write/round-trip
    // before `roomScreen` flips) used to pass with no feedback at all.
    loading: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.body,
    },
    coordRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    coordField: {
      flex: 1,
      gap: spacing.xs,
    },
    coordLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    coordInput: {
      ...typography.heading,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surfaceHigh,
      color: colors.text,
      fontSize: fontSize.body,
    },
  });

type CustomOriginInputsProps = {
  latitude: number;
  longitude: number;
  onChange: (patch: { customLatitude?: number; customLongitude?: number }) => void;
  readOnly?: boolean;
};

/**
 * Champs latitude/longitude controles localement (texte libre pendant la saisie, y compris "-"
 * ou "3." en cours de frappe) : ne pousse un nombre valide vers les reglages qu'une fois qu'il
 * parse vraiment, plutot que de faire sauter le champ a chaque caractere invalide.
 */
const CustomOriginInputs = ({ latitude, longitude, onChange, readOnly = false }: CustomOriginInputsProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();
  const [latText, setLatText] = useState(() => String(latitude));
  const [lonText, setLonText] = useState(() => String(longitude));

  const onLatChange = (text: string) => {
    setLatText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -90 && value <= 90) onChange({ customLatitude: value });
  };
  const onLonChange = (text: string) => {
    setLonText(text);
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value >= -180 && value <= 180) onChange({ customLongitude: value });
  };

  return (
    <View style={styles.coordRow}>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.latitude}</Text>
        <TextInput
          editable={!readOnly}
          keyboardType="numbers-and-punctuation"
          onChangeText={onLatChange}
          placeholderTextColor={colors.textMuted}
          pointerEvents={readOnly ? 'none' : 'auto'}
          style={styles.coordInput}
          value={latText}
        />
      </View>
      <View style={styles.coordField}>
        <Text style={styles.coordLabel}>{t.setup.customOrigin.longitude}</Text>
        <TextInput
          editable={!readOnly}
          keyboardType="numbers-and-punctuation"
          onChangeText={onLonChange}
          placeholderTextColor={colors.textMuted}
          style={styles.coordInput}
          value={lonText}
        />
      </View>
    </View>
  );
};

/**
 * Pur rendu : aucun hook a effet de bord (pas de `@/settings`, `@/games/compass/helpers/room`,
 * `@/games/compass/store/roomStore`) — `SetupScreen` (smart) resout tout en amont, ce composant ne fait que
 * lire des valeurs deja pretes et appeler des callbacks deja decides.
 */
export const SetupScreenView = ({
  settings,
  ready,
  available,
  soloName,
  soloPlaceholder,
  soloColor,
  nameEditable,
  onChangeName,
  connectedPlayers,
  localUid,
  hostUid,
  isHost,
  onKick,
  onlineChoice,
  onChooseSolo,
  onChooseHost,
  onChooseJoin,
  roomCode,
  joinCode,
  onJoinCodeChange,
  joinCodeIsValid,
  joinStatus,
  readOnly,
  onToggleCategory,
  onSelectDifficulty,
  onSelectRounds,
  onSelectMode,
  onToggleLiveCompass,
  onToggleUseGps,
  onChangeCustomOrigin,
  onToggleShowCountry,
  onToggleHideOtherAnswers,
  overlayMessage,
  startDisabled,
  onStartPress,
  onBack,
}: SetupScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const t = useTranslation();

  return (
    <>
      <Modal animationType="fade" transparent visible={overlayMessage !== null}>
        <View style={styles.noticeOverlay}>
          <Text style={styles.noticeText}>{overlayMessage}</Text>
        </View>
      </Modal>
      <Screen>
        <Text style={styles.title}>{t.setup.screenTitle}</Text>

        <Section title={t.setup.playersSection.title}>
          <View style={styles.names}>
            <View style={styles.nameRow}>
              <View style={styles.inputWrap}>
                <TextInput
                  accessibilityLabel={t.setup.playerNameAccessibility(1)}
                  editable={nameEditable}
                  maxLength={10}
                  onChangeText={onChangeName}
                  placeholder={soloPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  pointerEvents={nameEditable ? 'auto' : 'none'}
                  style={styles.input}
                  value={soloName}
                />
                <View style={[styles.initials, { borderColor: soloColor }]}>
                  <Text style={[styles.initialsText, { color: soloColor }]}>
                    {initials(soloName.trim() || soloPlaceholder)}
                  </Text>
                </View>
              </View>
            </View>
            {connectedPlayers.map(([uid, player]) => {
              if (uid === localUid) return null;
              // Falls back to the first palette color for the brief moment before the host's
              // own color-sync effect has assigned a real one.
              const color = player.color ?? colors.danger;
              const displayName = uid === hostUid ? t.setup.online.hostBadge(player.name) : player.name;
              return (
                <View key={uid} style={styles.nameRow}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      editable={false}
                      pointerEvents="none"
                      style={[styles.input, isHost && styles.inputWithRemove]}
                      value={displayName}
                    />
                    <View style={[styles.initials, { borderColor: color }]}>
                      <Text style={[styles.initialsText, { color }]}>{initials(player.name)}</Text>
                    </View>
                    {isHost && (
                      <Pressable
                        accessibilityLabel={t.setup.online.removePlayer(player.name)}
                        accessibilityRole="button"
                        onPress={() => onKick(uid)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.chips}>
            <Chip label={t.setup.online.solo} onPress={onChooseSolo} selected={onlineChoice === null} />
            <Chip label={t.setup.online.host} onPress={onChooseHost} selected={onlineChoice === 'host'} />
            <Chip label={t.setup.online.join} onPress={onChooseJoin} selected={onlineChoice === 'join'} />
          </View>
          {onlineChoice === 'host' && (
            <TextInput
              editable={false}
              placeholder={t.setup.online.generating}
              placeholderTextColor={colors.textMuted}
              style={styles.coordInput}
              value={roomCode ?? ''}
            />
          )}
          {onlineChoice === 'join' && (
            <>
              <TextInput
                autoCapitalize="none"
                onChangeText={onJoinCodeChange}
                placeholder={t.setup.online.codePlaceholder}
                placeholderTextColor={colors.textMuted}
                style={styles.coordInput}
                value={joinCode}
              />
              {joinCodeIsValid && joinStatus === 'invalid' && (
                <Text style={styles.hint}>{t.setup.online.invalidCode}</Text>
              )}
              {joinCodeIsValid && joinStatus === 'valid' && (
                <Text style={styles.hint}>{t.setup.online.joined(joinCode.trim())}</Text>
              )}
            </>
          )}
        </Section>

        <Section hint={t.setup.categoriesAvailability(available)} title={t.setup.categoriesTitle}>
          <View style={styles.chips}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                disabled={readOnly}
                emoji={category.emoji}
                label={t.setup.categories[category.id]}
                onPress={() => onToggleCategory(category.id)}
                selected={settings.categories.includes(category.id)}
              />
            ))}
          </View>
        </Section>

        <Section hint={t.setup.difficultyHint} title={t.setup.difficultyTitle}>
          <View style={styles.chips}>
            {DIFFICULTIES.map((difficulty) => (
              <Chip
                key={difficulty.id}
                disabled={readOnly}
                emoji={difficultyEmoji(difficulty, isDark)}
                label={t.setup.difficulties[difficulty.id]}
                onPress={() => onSelectDifficulty(difficulty.id)}
                selected={settings.difficulties.includes(difficulty.id)}
              />
            ))}
          </View>
        </Section>

        <Section title={t.setup.roundsTitle}>
          <View style={styles.chips}>
            {ROUND_OPTIONS.map((rounds) => (
              <Chip
                key={rounds}
                disabled={readOnly}
                label={String(rounds)}
                onPress={() => onSelectRounds(rounds)}
                selected={settings.rounds === rounds}
              />
            ))}
          </View>
        </Section>

        <Section title={t.setup.modeTitle}>
          <View style={styles.chips}>
            {DISTANCE_MODES.map((mode) => (
              <Chip
                key={mode.id}
                disabled={readOnly}
                label={t.setup.distanceModes[mode.id].label}
                onPress={() => onSelectMode(mode.straightLine)}
                selected={settings.straightLine === mode.straightLine}
              />
            ))}
          </View>
          <Text style={styles.hint}>
            {t.setup.distanceModes[settings.straightLine ? 'inclination' : 'distance'].description}
          </Text>
        </Section>

        <Section title={t.setup.optionsTitle}>
          <Toggle
            {...t.setup.toggles.liveCompass}
            disabled={readOnly}
            onValueChange={onToggleLiveCompass}
            value={settings.liveCompass}
          />
          <Toggle
            {...t.setup.toggles.useGps}
            disabled={readOnly}
            onValueChange={onToggleUseGps}
            value={settings.useGps}
          />
          {!settings.useGps && (
            <CustomOriginInputs
              key={ready ? 'ready' : 'loading'}
              latitude={settings.customLatitude}
              longitude={settings.customLongitude}
              onChange={onChangeCustomOrigin}
              readOnly={readOnly}
            />
          )}
          <Toggle
            {...t.setup.toggles.showCountry}
            disabled={readOnly}
            onValueChange={onToggleShowCountry}
            value={settings.showCountry}
          />
          {settings.playerNames.length > 1 && (
            <Toggle
              {...t.setup.toggles.hideOtherAnswers}
              disabled={readOnly}
              onValueChange={onToggleHideOtherAnswers}
              value={settings.hideOtherAnswers}
            />
          )}
        </Section>

        {onlineChoice !== 'join' && <Button disabled={startDisabled} label={t.setup.start} onPress={onStartPress} />}
        <Button label={t.setup.back} onPress={onBack} variant="ghost" />
      </Screen>
    </>
  );
};

export const SetupScreenLoading = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();

  return (
    <SafeAreaView style={styles.loading}>
      <ThemeBackdrop />
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.loadingText}>{t.game.loading}</Text>
    </SafeAreaView>
  );
};
