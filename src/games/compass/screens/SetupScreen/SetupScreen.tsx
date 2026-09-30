import { useEffect, useMemo, useState } from 'react';

import type { CompassCounts } from '@/data/firestore/types';
import { loadCompassCounts } from '@/games/compass/helpers/compassCounts';
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
  const room = useOnlineRoom(settings, updateSettings);
  // The group sizes (`meta/compassCounts`, loaded at launch): how many places the selected categories offer at
  // this difficulty. `null` until they are there — the start button is not held back for that.
  const [counts, setCounts] = useState<CompassCounts | null>(null);
  useEffect(() => {
    loadCompassCounts()
      .then(setCounts)
      .catch(() => {});
  }, []);
  const available = useMemo(
    () =>
      counts === null
        ? null
        : settings.categories.reduce((sum, category) => sum + (counts[category]?.[settings.difficulty] ?? 0), 0),
    [counts, settings.categories, settings.difficulty],
  );

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
