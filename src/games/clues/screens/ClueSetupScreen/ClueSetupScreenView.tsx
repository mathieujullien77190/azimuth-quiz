import { CLUE_CATEGORIES } from '@/games/clues/constants';
import { GAME_ICONS } from '@/data';
import { useTranslation } from '@/i18n';

import CategorySection from '@/components/setup/CategorySection';
import DifficultySection from '@/components/setup/DifficultySection';
import OptionsSection from '@/components/setup/OptionsSection';
import RoundsSection from '@/components/setup/RoundsSection';
import SetupScreenShell from '@/components/setup/SetupScreenShell';
import type { ClueSetupScreenViewProps } from './types';

/**
 * Pur rendu : aucun hook a effet de bord (pas de `@/settings`, `@/games/clues/helpers/room`,
 * `@/games/clues/store/roomStore`) — `ClueSetupScreen` (smart) resout tout en amont, meme
 * decoupage que Compass' propre `SetupScreen`/`SetupScreenView`. Le bloc commun aux jeux (titre,
 * partie solo/hote/invite, boutons) est dans `SetupScreenShell`, seules les sections propres a
 * Clues sont ici.
 */
export const ClueSetupScreenView = ({
  settings,
  available,
  party,
  readOnly,
  onToggleCategory,
  onSelectDifficulty,
  onToggleStartWithFirstLetter,
  onSelectRounds,
  overlayMessage,
  overlayLoading,
  onDismissOverlay,
  startDisabled,
  onStartPress,
  onBack,
}: ClueSetupScreenViewProps) => {
  const t = useTranslation();

  return (
    <SetupScreenShell
      backLabel={t.setup.quit}
      onBack={onBack}
      onDismissOverlay={onDismissOverlay}
      onStartPress={onStartPress}
      overlayLoading={overlayLoading}
      overlayMessage={overlayMessage}
      party={party}
      startDisabled={startDisabled}
      startLabel={t.cluesSetup.start}
      icon={GAME_ICONS.clues}
      title={t.cluesSetup.screenTitle}
    >
      <CategorySection
        categories={CLUE_CATEGORIES}
        disabled={readOnly}
        hint={t.setup.categoriesAvailability(available)}
        onToggle={onToggleCategory}
        selected={settings.categories}
        title={t.setup.categoriesTitle}
      />

      <DifficultySection
        disabled={readOnly}
        hint={t.cluesSetup.difficultyHint}
        onSelect={onSelectDifficulty}
        selected={settings.difficulty}
        title={t.cluesSetup.difficultyTitle}
      />

      <RoundsSection disabled={readOnly} onSelect={onSelectRounds} rounds={settings.rounds} />

      <OptionsSection
        disabled={readOnly}
        options={[
          {
            id: 'startWithFirstLetter',
            title: t.cluesSetup.toggles.startWithFirstLetter.label,
            description: t.cluesSetup.toggles.startWithFirstLetter.description,
            value: settings.startWithFirstLetter,
            onChange: onToggleStartWithFirstLetter,
          },
        ]}
        title={t.cluesSetup.optionsTitle}
      />
    </SetupScreenShell>
  );
};
