import { filterPlaces } from '@/helpers';
import { useLanguage } from '@/i18n';
import { useSettings } from '@/settings';

import { selectDifficultyFilter, toggleCategoryFilter } from './helpers';
import { SetupScreenLoading, SetupScreenView } from './SetupScreenView';
import type { SetupScreenProps } from './types';
import { useOnlineRoom } from './useOnlineRoom';

/**
 * Smart container: owns `useSettings()`/`useOnlineRoom()`, resolves every readOnly-gated action
 * into an already-decided callback, and maps everything onto `SetupScreenView` (pure rendering).
 */
export const SetupScreen = ({ onStart, onBack }: SetupScreenProps) => {
  const { settings, ready, updateSettings } = useSettings();
  const { language } = useLanguage();
  const room = useOnlineRoom(settings, updateSettings);
  const available = filterPlaces(settings.categories, settings.difficulties, language).length;

  if (room.starting) return <SetupScreenLoading />;

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  return (
    <SetupScreenView
      available={available}
      connectedPlayers={room.connectedPlayers}
      hostUid={room.hostUid}
      isHost={room.isHost}
      joinCode={room.joinCode}
      joinCodeIsValid={room.joinCodeIsValid}
      joinStatus={room.joinStatus}
      localUid={room.localUid}
      nameEditable={room.connectedRoomCode === null}
      onBack={onBack}
      onChangeCustomOrigin={updateSettings}
      onChangeName={(text) => updateSettings({ playerNames: [text] })}
      onChooseHost={room.chooseHost}
      onChooseJoin={room.chooseJoin}
      onChooseSolo={room.chooseSolo}
      onJoinCodeChange={room.setJoinCode}
      onKick={room.kick}
      onSelectDifficulty={(id) => updateOrNotify(selectDifficultyFilter(settings, id))}
      onSelectMode={(straightLine) => updateOrNotify({ straightLine })}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onStartPress={room.onlineChoice === 'host' ? room.startOnlineGame : onStart}
      onToggleCategory={(id) => updateOrNotify(toggleCategoryFilter(settings, id))}
      onToggleHideOtherAnswers={(value) => updateOrNotify({ hideOtherAnswers: value })}
      onToggleLiveCompass={(value) => updateOrNotify({ liveCompass: value })}
      onToggleShowCountry={(value) => updateOrNotify({ showCountry: value })}
      onToggleUseGps={(value) => updateOrNotify({ useGps: value })}
      onlineChoice={room.onlineChoice}
      overlayMessage={room.overlayMessage}
      readOnly={room.readOnly}
      ready={ready}
      roomCode={room.roomCode}
      settings={settings}
      soloColor={room.soloColor}
      soloName={room.soloName}
      soloPlaceholder={room.soloPlaceholder}
      startDisabled={available === 0}
    />
  );
};
