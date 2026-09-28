import { filterPlaces } from '@/helpers';
import { useLanguage } from '@/i18n';
import { useSettings } from '@/settings';

import { selectDifficultyFilter, toggleCategoryFilter } from './helpers';
import { SetupScreenView } from './SetupScreenView';
import type { SetupScreenProps } from './types';
import { useOnlineRoom } from './useOnlineRoom';

/**
 * Smart container: owns `useSettings()`/`useOnlineRoom()`, resolves every readOnly-gated action
 * into an already-decided callback, and maps everything onto `SetupScreenView` (pure rendering).
 */
export const SetupScreen = ({ onBack }: SetupScreenProps) => {
  const { settings, ready, updateSettings } = useSettings();
  const { language } = useLanguage();
  const room = useOnlineRoom(settings, updateSettings);
  const available = filterPlaces(settings.categories, settings.difficulties, language).length;

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  return (
    <SetupScreenView
      available={available}
      onBack={onBack}
      onChangeCustomOrigin={updateSettings}
      onDismissOverlay={room.dismissOverlay}
      onSelectDifficulty={(id) => updateOrNotify(selectDifficultyFilter(settings, id))}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onStartPress={room.startOnlineGame}
      onToggleCategory={(id) => updateOrNotify(toggleCategoryFilter(settings, id))}
      onToggleHideOtherAnswers={(value) => updateOrNotify({ hideOtherAnswers: value })}
      onToggleLiveCompass={(value) => updateOrNotify({ liveCompass: value })}
      onToggleShowCountry={(value) => updateOrNotify({ showCountry: value })}
      onToggleUseGps={(value) => updateOrNotify({ useGps: value })}
      overlayLoading={room.overlayLoading}
      overlayMessage={room.overlayMessage}
      party={room.party}
      readOnly={room.readOnly}
      ready={ready}
      settings={settings}
      startDisabled={available === 0}
    />
  );
};
