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
 * Compass' own "Partie" section: solo name, or host/join a room — dumb, lifted straight out of
 * `SetupScreenView`. The online sub-labels (`t.setup.online.*`) are read directly since they're
 * already shared regardless of which game ends up using this; only `title`/`hint` are props,
 * since those live in each game's own translation namespace.
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
          // Falls back to the first palette color for the brief moment before the host's own
          // color-sync effect has assigned a real one.
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
          // Connected: the code field is locked (see the comment below), so this is the only way
          // back to a fresh, editable one — `onChooseJoin` (not `onChooseSolo`) so this stays on
          // "Join" rather than dropping back to solo.
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
          {/* Locked once joined, like the name field above: `connectedRoomCode` is derived
              straight from this text, so editing it further after a successful join would
              silently disconnect the room (read as a spurious "kicked" notice) and unlock the
              name/options fields again. The chip above turns into "Leave" at that point, the
              only way back to a fresh, editable code. */}
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
