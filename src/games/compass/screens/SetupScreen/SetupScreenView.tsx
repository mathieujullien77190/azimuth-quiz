import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DIFFICULTIES, ROUND_OPTIONS, difficultyEmoji } from '@/data';
import { CATEGORIES } from '@/games/compass/constants';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import PartySection from '@/components/setup/PartySection';
import ThemeBackdrop from '@/components/ThemeBackdrop';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Toggle from '@/components/ui/Toggle';
import { DISTANCE_MODES } from './constants';
import type { SetupScreenViewProps } from './types';

import { createStyles } from './styles';

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
  onDismissOverlay,
  startDisabled,
  onStartPress,
  onBack,
}: SetupScreenViewProps) => {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const t = useTranslation();

  return (
    <>
      <Modal animationType="fade" transparent visible={overlayMessage !== null}>
        <Pressable style={styles.noticeOverlay} onPress={onDismissOverlay}>
          <Text style={styles.noticeText}>{overlayMessage}</Text>
        </Pressable>
      </Modal>
      <Screen>
        <Text style={styles.title}>{t.setup.screenTitle}</Text>

        <PartySection
          connectedPlayers={connectedPlayers}
          hint={t.setup.playersSection.hint}
          hostUid={hostUid}
          isHost={isHost}
          joinCode={joinCode}
          joinCodeIsValid={joinCodeIsValid}
          joinStatus={joinStatus}
          localUid={localUid}
          nameEditable={nameEditable}
          onChangeName={onChangeName}
          onChooseHost={onChooseHost}
          onChooseJoin={onChooseJoin}
          onChooseSolo={onChooseSolo}
          onJoinCodeChange={onJoinCodeChange}
          onKick={onKick}
          onlineChoice={onlineChoice}
          roomCode={roomCode}
          soloColor={soloColor}
          soloName={soloName}
          soloPlaceholder={soloPlaceholder}
          title={t.setup.playersSection.title}
        />

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
