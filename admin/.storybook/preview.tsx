import type { Preview } from '@storybook/react-vite';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { polyfillFlagEmoji } from '@/helpers';
import { LanguageContext } from '@/i18n';
import type { Language } from '@/i18n';
import { THEMES, ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

// The app does this once at startup (`src/app/_layout.tsx`): without it Chromium on Windows shows a
// flag emoji as its two-letter code ("JP") instead of the flag. Storybook doesn't go through the
// app's root layout, so the flag webfont (`FLAG_FONT_FAMILY`) has to be loaded here too.
polyfillFlagEmoji();

const THEME_IDS: ThemeId[] = ['night', 'day'];
const LANGUAGES: Language[] = ['fr', 'en'];

/**
 * The toolbar's theme and language, provided to every story the way the app's own providers do
 * (`ThemeProvider`, `LanguageProvider`) — minus their storage, which a story has no use for. A story
 * that pins one of them on purpose (`MascotButton`, `GameFooter` by day...) wraps itself in its own
 * `ThemeSettingsContext.Provider`, which wins over this one.
 */
const AppContexts = ({
  themeId,
  language,
  children,
}: {
  themeId: ThemeId;
  language: Language;
  children: React.ReactNode;
}) => {
  const theme = useMemo(
    () => ({
      themeId,
      ready: true,
      setThemeId: () => {},
      resetThemeId: () => {},
      animationsEnabled: false,
      setAnimationsEnabled: () => {},
      resetAnimationsEnabled: () => {},
    }),
    [themeId],
  );
  const lang = useMemo(() => ({ language, ready: true, setLanguage: () => {}, resetLanguage: () => {} }), [language]);

  return (
    <ThemeSettingsContext.Provider value={theme}>
      <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>
    </ThemeSettingsContext.Provider>
  );
};

const preview: Preview = {
  // The two toolbar switches: `theme` (the app's Night / Day) and `locale` (its French / English).
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'night', title: 'Night', icon: 'moon' },
          { value: 'day', title: 'Day', icon: 'sun' },
        ],
      },
    },
    locale: {
      description: 'Language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        dynamicTitle: true,
        items: [
          { value: 'fr', title: 'Français', right: '🇫🇷' },
          { value: 'en', title: 'English', right: '🇬🇧' },
        ],
      },
    },
  },
  initialGlobals: { theme: 'night', locale: 'fr' },
  decorators: [
    (Story, context) => {
      const themeId = THEME_IDS.includes(context.globals.theme) ? (context.globals.theme as ThemeId) : 'night';
      const language = LANGUAGES.includes(context.globals.locale) ? (context.globals.locale as Language) : 'fr';
      // The app's own themes are both tinted (night blue, day sky blue): a white canvas behind every
      // story clashes with all of them, so the preview iframe takes the current theme's background.
      const background = THEMES[themeId].colors.background;
      return (
        <>
          <style>{`html, body, #storybook-root { background: ${background}; min-height: 100%; }`}</style>
          {/* `ui/Screen`'s `SafeAreaView` throws ("No safe area value available") without a
              `SafeAreaProvider` above it. */}
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 1024, height: 768 },
              insets: { top: 0, right: 0, bottom: 0, left: 0 },
            }}
          >
            <AppContexts language={language} themeId={themeId}>
              <Story />
            </AppContexts>
          </SafeAreaProvider>
        </>
      );
    },
  ],
  parameters: {
    // The app's own components first, then each game's, and the two generic families — the setup
    // sections and the UI primitives — at the bottom of the sidebar.
    options: {
      storySort: { order: ['Common', 'Compass', 'Clues', 'Setup', 'UI'] },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
