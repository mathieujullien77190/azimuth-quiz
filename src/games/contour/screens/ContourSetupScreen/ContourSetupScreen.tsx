import { useContourSettings } from '@/settings';

import LoadingScreen from '@/components/LoadingScreen';
import { ContourSetupScreenView } from './ContourSetupScreenView';
import type { ContourSetupScreenProps } from './types';
import { useOnlineContourRoom } from './useOnlineContourRoom';

/**
 * Smart container: owns `useContourSettings()`/`useOnlineContourRoom()`, resolves every
 * readOnly-gated action into an already-decided callback, and maps everything onto
 * `ContourSetupScreenView` (pure rendering) — same split as Compass/Clues.
 */
export const ContourSetupScreen = ({ onStart, onBack }: ContourSetupScreenProps) => {
  const { settings, updateSettings } = useContourSettings();
  const room = useOnlineContourRoom(settings, updateSettings);

  if (room.starting) return <LoadingScreen />;

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  return (
    <ContourSetupScreenView
      onBack={onBack}
      onDismissOverlay={room.dismissOverlay}
      onSelectDifficulty={(id) => updateOrNotify({ difficulty: id })}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onStartPress={room.onlineChoice === 'host' ? room.startOnlineContourGame : onStart}
      overlayMessage={room.overlayMessage}
      party={room.party}
      readOnly={room.readOnly}
      settings={settings}
    />
  );
};
