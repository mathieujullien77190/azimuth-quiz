import { useContourSettings } from '@/settings';
import { useTranslation } from '@/i18n';

import NoticeOverlay from '@/components/NoticeOverlay';
import { ContourSetupScreenView } from './ContourSetupScreenView';
import type { ContourSetupScreenProps } from './types';
import { useOnlineContourRoom } from './useOnlineContourRoom';

/**
 * Smart container: owns `useContourSettings()`/`useOnlineContourRoom()`, resolves every
 * readOnly-gated action into an already-decided callback, and maps everything onto
 * `ContourSetupScreenView` (pure rendering) — same split as Compass/Clues.
 */
export const ContourSetupScreen = ({ onBack }: ContourSetupScreenProps) => {
  const t = useTranslation();
  const { settings, updateSettings } = useContourSettings();
  const room = useOnlineContourRoom(settings, updateSettings);

  if (room.starting) return <NoticeOverlay loading message={t.game.loading} onDismiss={() => {}} />;

  const updateOrNotify = (patch: Partial<typeof settings>) =>
    room.readOnly ? room.notifyReadOnly() : updateSettings(patch);

  return (
    <ContourSetupScreenView
      onBack={onBack}
      onDismissOverlay={room.dismissOverlay}
      onSelectDifficulty={(id) => updateOrNotify({ difficulty: id })}
      onSelectRounds={(rounds) => updateOrNotify({ rounds })}
      onStartPress={room.startOnlineContourGame}
      overlayMessage={room.overlayMessage}
      party={room.party}
      readOnly={room.readOnly}
      settings={settings}
    />
  );
};
