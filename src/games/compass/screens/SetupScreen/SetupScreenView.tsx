import { CATEGORIES } from '@/games/compass/constants';
import { GAME_ICONS } from '@/data';
import { useTranslation } from '@/i18n';

import CategorySection from '@/components/setup/CategorySection';
import DifficultySection from '@/components/setup/DifficultySection';
import OptionsSection from '@/components/setup/OptionsSection';
import RoundsSection from '@/components/setup/RoundsSection';
import SetupScreenShell from '@/components/setup/SetupScreenShell';
import type { SetupScreenViewProps } from './types';

/**
 * Pur rendu : aucun hook a effet de bord (pas de `@/settings`, `@/games/compass/helpers/room`,
 * `@/games/compass/store/roomStore`) — `SetupScreen` (smart) resout tout en amont, ce composant ne fait que
 * lire des valeurs deja pretes et appeler des callbacks deja decides. Le bloc commun aux jeux
 * (titre, partie solo/hote/invite, boutons) est dans `SetupScreenShell`, seules les sections
 * propres a Compass sont ici.
 */
export const SetupScreenView = ({
  settings,
  ready,
  available,
  party,
  readOnly,
  onToggleCategory,
  onSelectDifficulty,
  onSelectRounds,
  onToggleLiveCompass,
  onToggleUseGps,
  onChangeCustomOrigin,
  onToggleShowCountry,
  overlayMessage,
  overlayLoading,
  onDismissOverlay,
  startDisabled,
  onStartPress,
  onBack,
}: SetupScreenViewProps) => {
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
      startLabel={t.setup.start}
      icon={GAME_ICONS.compass}
      title={t.home.games.compass.title}
    >
      <CategorySection
        categories={CATEGORIES}
        disabled={readOnly}
        hint={t.setup.categoriesAvailability(available)}
        onToggle={onToggleCategory}
        selected={settings.categories}
        title={t.setup.categoriesTitle}
      />

      <DifficultySection
        disabled={readOnly}
        hint={t.setup.difficultyHint}
        onSelect={onSelectDifficulty}
        selected={settings.difficulty}
        title={t.setup.difficultyTitle}
      />

      <RoundsSection disabled={readOnly} onSelect={onSelectRounds} rounds={settings.rounds} />

      <OptionsSection
        disabled={readOnly}
        gps={{
          title: t.setup.toggles.useGps.label,
          description: t.setup.toggles.useGps.description,
          useGps: settings.useGps,
          onToggleUseGps,
          latitude: settings.customLatitude,
          longitude: settings.customLongitude,
          onChangeCustomOrigin,
          ready,
        }}
        options={[
          {
            id: 'liveCompass',
            title: t.setup.toggles.liveCompass.label,
            description: t.setup.toggles.liveCompass.description,
            value: settings.liveCompass,
            onChange: onToggleLiveCompass,
          },
          {
            id: 'showCountry',
            title: t.setup.toggles.showCountry.label,
            description: t.setup.toggles.showCountry.description,
            value: settings.showCountry,
            onChange: onToggleShowCountry,
          },
        ]}
        title={t.setup.optionsTitle}
      />
    </SetupScreenShell>
  );
};
