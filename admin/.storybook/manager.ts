import { GLOBALS_UPDATED, SET_CONFIG, SET_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

// Chrome de Storybook : theme classique (clair/sombre), independant du theme du jeu. Le theme du jeu ne sert qu'aux
// composants dans la preview (voir `preview.tsx`).
const THEMES = {
  night: create({ base: 'dark', brandTitle: 'Azimuth Quiz Storybook' }),
  day: create({ base: 'light', brandTitle: 'Azimuth Quiz Storybook' }),
};
// Sombre tant que la barre d outils n a rien dit.
addons.setConfig({ theme: THEMES.night });

/** Suit le choix `theme` de la barre d'outils (voir `globalTypes` de `preview.tsx`). */
addons.register('azimuth/theme-sync', (api) => {
  const apply = (globals: { theme?: string } | undefined) =>
    api.setOptions({ theme: globals?.theme === 'day' ? THEMES.day : THEMES.night });

  apply(api.getGlobals());

  const channel = addons.getChannel();
  // La preview remet les options a l'initial au chargement : on reapplique le choix de la barre d'outils.
  channel.on(SET_CONFIG, () => apply(api.getGlobals()));
  channel.on(SET_GLOBALS, ({ globals }: { globals?: { theme?: string } }) => apply(globals));
  channel.on(
    GLOBALS_UPDATED,
    ({ userGlobals, globals }: { userGlobals?: { theme?: string }; globals?: { theme?: string } }) =>
      apply(userGlobals ?? globals),
  );
});
