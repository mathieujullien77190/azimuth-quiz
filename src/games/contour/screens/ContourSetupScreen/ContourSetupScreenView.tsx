import { useTranslation } from '@/i18n';

import DifficultySection from '@/components/setup/DifficultySection';
import RoundsSection from '@/components/setup/RoundsSection';
import SetupScreenShell from '@/components/setup/SetupScreenShell';
import type { ContourSetupScreenViewProps } from './types';

/**
 * Pur rendu : aucun hook a effet de bord (pas de `@/settings`, `@/games/contour/helpers/room`,
 * `@/games/contour/store/roomStore`) — `ContourSetupScreen` (smart) resout tout en amont, meme
 * decoupage que Compass/Clues. Le bloc commun aux jeux (titre, partie solo/hote/invite, boutons) est
 * dans `SetupScreenShell`, seules les sections propres a Silhouette sont ici.
 */
export const ContourSetupScreenView = ({
  settings,
  party,
  readOnly,
  onSelectDifficulty,
  onSelectRounds,
  overlayMessage,
  onDismissOverlay,
  onStartPress,
  onBack,
}: ContourSetupScreenViewProps) => {
  const t = useTranslation();

  return (
    <SetupScreenShell
      backLabel={t.contourSetup.back}
      onBack={onBack}
      onDismissOverlay={onDismissOverlay}
      onStartPress={onStartPress}
      overlayMessage={overlayMessage}
      party={party}
      startDisabled={false}
      startLabel={t.contourSetup.start}
      title={t.contourSetup.screenTitle}
    >
      <DifficultySection
        disabled={readOnly}
        hint={t.contourSetup.difficultyHint}
        onSelect={onSelectDifficulty}
        selected={[settings.difficulty]}
        title={t.contourSetup.difficultyTitle}
      />

      <RoundsSection disabled={readOnly} onSelect={onSelectRounds} rounds={settings.rounds} />
    </SetupScreenShell>
  );
};
