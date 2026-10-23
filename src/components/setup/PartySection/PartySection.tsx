import { Text, TextInput, View } from 'react-native';

import { initials } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useTheme, useThemedStyles } from '@/themes';

import Chip from '@/components/ui/Chip';
import MiniButton from '@/components/ui/MiniButton';
import Section from '@/components/ui/Section';
import Spinner from '@/components/ui/Spinner';
import type { PartySectionProps } from './types';

import { createStyles } from './styles';

/**
 * Section « Partie » : nom solo, ou heberger/rejoindre une room (dumb), sortie de `SetupScreenView`. Les
 * sous-libelles en ligne (`t.setup.online.*`) sont lus directement (communs a tous les jeux) ; seuls
 * `title`/`hint` sont des props (namespace propre a chaque jeu).
 */
export const PartySection = ({
  title,
  hint,
  soloName,
  soloPlaceholder,
  soloColor,
  nameEditable,
  onChangeName,
  nameError = null,
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
}: PartySectionProps) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const t = useTranslation();

  return (
    <Section hint={hint} title={title}>
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
        {nameError !== null && <Text style={styles.error}>{nameError}</Text>}
        {connectedPlayers.map(([uid, player]) => {
          if (uid === localUid) return null;
          // Repli sur la premiere couleur de la palette le temps que l'effet de l'hote en assigne une vraie.
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
                  <View pointerEvents="box-none" style={styles.removeButton}>
                    <MiniButton
                      accessibilityLabel={t.setup.online.removePlayer(player.name)}
                      label={t.setup.online.kick}
                      onPress={() => onKick(uid)}
                      variant="danger"
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.chips}>
        <Chip label={t.setup.online.solo} onPress={onChooseSolo} selected={onlineChoice === null} />
        <Chip label={t.setup.online.host} onPress={onChooseHost} selected={onlineChoice === 'host'} />
        {joinStatus === 'valid' ? (
          // Connecte : le champ code est verrouille, c'est donc le seul retour vers un code frais et editable. Utilise
          // `onChooseJoin` (pas `onChooseSolo`) pour rester sur « Rejoindre ».
          <Chip label={t.setup.online.leave} onPress={onChooseJoin} selected />
        ) : (
          <Chip label={t.setup.online.join} onPress={onChooseJoin} selected={onlineChoice === 'join'} />
        )}
      </View>
      {onlineChoice === 'host' && (
        <View style={styles.coordInputWrap}>
          <TextInput
            editable={false}
            placeholder={t.setup.online.generating}
            placeholderTextColor={colors.textMuted}
            style={styles.coordInput}
            value={roomCode ?? ''}
          />
          {roomCode === null && (
            <View style={styles.coordSpinner}>
              <Spinner color={colors.textMuted} size="small" />
            </View>
          )}
        </View>
      )}
      {onlineChoice === 'join' && (
        <>
          {/* Verrouille une fois rejoint, comme le champ nom : `connectedRoomCode` derive directement de ce texte, donc
              l'editer apres la jonction deconnecterait la room (lu comme une expulsion) et deverrouillerait nom et options.
              La puce devient « Quitter », seul retour vers un code editable. */}
          <TextInput
            autoCapitalize="none"
            editable={joinStatus !== 'valid'}
            onChangeText={onJoinCodeChange}
            placeholder={t.setup.online.codePlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.coordInput}
            value={joinCode}
          />
          {joinCodeIsValid && joinStatus === 'invalid' && <Text style={styles.hint}>{t.setup.online.invalidCode}</Text>}
          {joinCodeIsValid && joinStatus === 'valid' && (
            <Text style={styles.hint}>{t.setup.online.joined(joinCode.trim())}</Text>
          )}
        </>
      )}
    </Section>
  );
};
