import { reporting } from '@/helpers/reportError';
import { useEffect, useMemo, useState } from 'react';

import type { CompassCounts } from '@/data/firestore/types';
import { loadCluesCounts } from '@/games/clues/helpers/clueCounts';
import { useClueSettings } from '@/settings';
import type { Category } from '@/types';

import { ClueSetupScreenView } from './ClueSetupScreenView';
import type { ClueSetupScreenProps } from './types';
import { useOnlineClueRoom } from './useOnlineClueRoom';

/** Container smart : appelle `useClueSettings()`/`useOnlineClueRoom()`, decide les callbacks (readOnly...) et alimente `ClueSetupScreenView` (rendu pur). */
export const ClueSetupScreen = ({ onBack }: ClueSetupScreenProps) => {
  const { settings, updateSettings } = useClueSettings();
  const room = useOnlineClueRoom(settings, updateSettings);

  // Tailles des groupes (`meta/cluesCounts`) : nombre de lieux offerts par la selection ; `null` tant qu'elles ne sont pas la (le bouton n'attend pas).
  const [counts, setCounts] = useState<CompassCounts | null>(null);
  useEffect(() => {
    loadCluesCounts()
      .then(setCounts)
      .catch(reporting('clues.loadCounts', { kind: 'background' }));
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
