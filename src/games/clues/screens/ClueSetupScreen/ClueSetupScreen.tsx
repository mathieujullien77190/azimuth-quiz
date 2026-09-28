import { useEffect, useMemo } from 'react';

import { CLUE_PLACES, isCapitalPlace, isFrenchCityPlace } from '@/data';
import { loadClueHistory } from '@/games/clues/helpers/clueHistory';
import { effectiveDifficulty } from '@/games/compass/helpers/places';
import { useLanguage } from '@/i18n';
import { useClueSettings } from '@/settings';
import type { Category } from '@/types';

import { ClueSetupScreenView } from './ClueSetupScreenView';
import type { ClueSetupScreenProps } from './types';
import { useOnlineClueRoom } from './useOnlineClueRoom';

/**
 * Smart container: owns `useClueSettings()`/`useOnlineClueRoom()`, resolves every readOnly-gated
 * action into an already-decided callback, and maps everything onto `ClueSetupScreenView` (pure
 * rendering) — same split as Compass' own `SetupScreen`/`SetupScreenView`.
 */
export const ClueSetupScreen = ({ onBack }: ClueSetupScreenProps) => {
  const { settings, updateSettings } = useClueSettings();
  const { language } = useLanguage();
  const room = useOnlineClueRoom(settings, updateSettings);

  const available = useMemo(
    () =>
      CLUE_PLACES.filter((place) => {
        const category = isCapitalPlace(place) ? 'capital' : isFrenchCityPlace(place) ? 'citiesFr' : 'cities';
        return settings.categories.includes(category) && effectiveDifficulty(place, language) === settings.difficulty;
      }).length,
    [settings.categories, settings.difficulty, language],
  );

  // Fire-and-forget: by the time the player presses "Start", the read is essentially always
  // done, so the very first round already benefits from the draw history.
  useEffect(() => {
    loadClueHistory();
  }, []);

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  const toggleCategory = (id: Category) => {
    const category = id as (typeof settings.categories)[number];
    const categories = settings.categories.includes(category)
      ? settings.categories.filter((c) => c !== category)
      : [...settings.categories, category];
    updateOrNotify({ categories });
  };

  return (
    <ClueSetupScreenView
      available={available}
      onBack={onBack}
      onDismissOverlay={room.dismissOverlay}
      onSelectDifficulty={(id) => updateOrNotify({ difficulty: id })}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onStartPress={room.startOnlineClueGame}
      onToggleCategory={toggleCategory}
      onToggleStartWithFirstLetter={(value) => updateOrNotify({ startWithFirstLetter: value })}
      overlayLoading={room.overlayLoading}
      overlayMessage={room.overlayMessage}
      party={room.party}
      readOnly={room.readOnly}
      settings={settings}
      startDisabled={available === 0}
    />
  );
};
