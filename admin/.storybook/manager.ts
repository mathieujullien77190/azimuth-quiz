import { GLOBALS_UPDATED, SET_CONFIG, SET_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

// Chrome de Storybook : bundle a part des previews, donc pas d'alias `@/` (themes importes en relatif, sans
// react-native).
import { day } from '../../src/themes/day';
import { FONT_FAMILY } from '../../src/themes/fonts';
import { night } from '../../src/themes/night';
import type { Theme } from '../../src/types';

/** Theme Storybook tire d'un theme de l'app, pour que le chrome suive la preview. */
const storybookTheme = (theme: Theme) =>
  create({
    base: theme.isDark ? 'dark' : 'light',
    brandTitle: 'Azimuth Quiz Storybook',
    fontBase: FONT_FAMILY,
    colorPrimary: theme.colors.accent,
    colorSecondary: theme.colors.accent,
    appBg: theme.colors.background,
    appContentBg: theme.colors.surface,
    appPreviewBg: theme.colors.background,
    appBorderColor: theme.colors.border,
    textColor: theme.colors.text,
    textInverseColor: theme.colors.onAccent,
    barBg: theme.colors.surface,
    barTextColor: theme.colors.textMuted,
    barSelectedColor: theme.colors.accent,
    inputBg: theme.colors.surfaceHigh,
    inputBorder: theme.colors.border,
    inputTextColor: theme.colors.text,
  });

const THEMES = { night: storybookTheme(night), day: storybookTheme(day) };

// Nuit tant que la barre d'outils n'a rien dit.
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
