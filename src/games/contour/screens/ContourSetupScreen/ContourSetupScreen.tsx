import { CONTOUR_HINT_CATEGORIES } from '@/games/contour/constants';
import { useContourSettings } from '@/settings';
import type { ContourHintCategory } from '@/types';

import { ContourSetupScreenView } from './ContourSetupScreenView';
import type { ContourSetupScreenProps } from './types';
import { useOnlineContourRoom } from './useOnlineContourRoom';

/**
 * Smart container: owns `useContourSettings()`/`useOnlineContourRoom()`, resolves every
 * readOnly-gated action into an already-decided callback, and maps everything onto
 * `ContourSetupScreenView` (pure rendering) — same split as Compass/Clues.
 */
export const ContourSetupScreen = ({ onBack }: ContourSetupScreenProps) => {
  const { settings, updateSettings } = useContourSettings();
  const room = useOnlineContourRoom(settings, updateSettings);

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  // Multi-select in the plan's fixed order; the last category cannot be removed (a round needs at
  // least one kind of hint).
  const toggleHintCategory = (id: ContourHintCategory) => {
    const next = CONTOUR_HINT_CATEGORIES.map((category) => category.id).filter((category) =>
      category === id ? !settings.hintCategories.includes(id) : settings.hintCategories.includes(category),
    );
    if (next.length > 0) updateOrNotify({ hintCategories: next });
  };

  return (
    <ContourSetupScreenView
      onBack={onBack}
      onDismissOverlay={room.dismissOverlay}
      onSelectDifficulty={(id) => updateOrNotify({ difficulty: id })}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onToggleHintCategory={toggleHintCategory}
      onStartPress={room.startOnlineContourGame}
      overlayLoading={room.overlayLoading}
      overlayMessage={room.overlayMessage}
      party={room.party}
      readOnly={room.readOnly}
      settings={settings}
    />
  );
};
