import { GLOBALS_UPDATED, SET_CONFIG, SET_GLOBALS } from 'storybook/internal/core-events';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

// Storybook's own chrome (sidebar, toolbar, panels) — a separate bundle from the previews, so no `@/`
// alias here: the app's themes are imported by relative path (they hold only colors and strings, no
// react-native).
import { day } from '../../src/themes/day';
import { FONT_FAMILY } from '../../src/themes/fonts';
import { night } from '../../src/themes/night';
import type { Theme } from '../../src/types';

/** Storybook's UI theme built from one of the app's own themes, so the chrome matches the preview. */
const storybookTheme = (theme: Theme) =>
  create({
    base: theme.isDark ? 'dark' : 'light',
    brandTitle: 'Azimuth Quiz',
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

// Night until the toolbar says otherwise (the preview's `initialGlobals` starts on night too).
addons.setConfig({ theme: THEMES.night });

/**
 * Follows the toolbar's `theme` switch (see `preview.tsx`'s `globalTypes`): Night or Day for the
 * preview also flips Storybook's own UI.
 */
addons.register('azimuth/theme-sync', (api) => {
  const apply = (globals: { theme?: string } | undefined) =>
    api.setOptions({ theme: globals?.theme === 'day' ? THEMES.day : THEMES.night });

  apply(api.getGlobals());

  const channel = addons.getChannel();
  // The preview announces its config once it loads, and the manager answers by resetting the options to
  // the initial ones (Night, see `setConfig` above): re-apply the toolbar's choice right after.
  channel.on(SET_CONFIG, () => apply(api.getGlobals()));
  channel.on(SET_GLOBALS, ({ globals }: { globals?: { theme?: string } }) => apply(globals));
  channel.on(
    GLOBALS_UPDATED,
    ({ userGlobals, globals }: { userGlobals?: { theme?: string }; globals?: { theme?: string } }) =>
      apply(userGlobals ?? globals),
  );
});
