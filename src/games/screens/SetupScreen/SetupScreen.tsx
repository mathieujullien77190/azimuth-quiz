import { reporting } from '@/helpers/reportError';
import { useEffect, useMemo, useState } from 'react';

import type { Counts } from '@/data/firestore/types';
import { loadCounts } from '@/games/helpers/counts';
import { useSettings } from '@/settings';

import { selectDifficultyFilter, toggleCategoryFilter } from './helpers';
import { SetupScreenView } from './SetupScreenView';
import type { SetupScreenProps } from './types';
import { useOnlineRoom } from './useOnlineRoom';

/**
 * Container smart : `useSettings()`/`useOnlineRoom()`, actions deja decidees (readOnly), puis
 * `SetupScreenView` (rendu pur).
 */
export const SetupScreen = ({ onBack, startInJoin = false }: SetupScreenProps) => {
  const { settings, ready, updateSettings } = useSettings();
  const room = useOnlineRoom(settings, updateSettings, startInJoin);
  // Tailles des groupes (`meta/compassCounts`) : combien de lieux offrent les categories choisies a cette
  // difficulte ; `null` tant qu'absentes, sans retenir le bouton.
  const [counts, setCounts] = useState<Counts | null>(null);
  useEffect(() => {
    loadCounts()
      .then(setCounts)
      .catch(reporting('game.loadCounts', { kind: 'background' }));
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
      onToggleTravel={(value) => updateOrNotify({ travel: value })}
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
