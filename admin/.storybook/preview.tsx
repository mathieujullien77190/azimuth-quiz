import type { Preview } from '@storybook/react-vite';
import { useMemo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { polyfillFlagEmoji } from '@/helpers';
import { LanguageContext } from '@/i18n';
import type { Language } from '@/i18n';
import { THEMES, ThemeSettingsContext } from '@/themes';
import type { ThemeId } from '@/types';

// Chromium sous Windows affiche un emoji drapeau en deux lettres sans la webfont (`FLAG_FONT_FAMILY`) : a charger ici
// aussi, Storybook ne passe pas par le layout racine.
polyfillFlagEmoji();

const THEME_IDS: ThemeId[] = ['night', 'day'];
const LANGUAGES: Language[] = ['fr', 'en'];

/** Theme et langue de la barre d'outils, fournis a chaque story comme le font les providers de l'app. */
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
      // Les deux themes sont teintes : un fond blanc jure, l'iframe prend le fond du theme.
      const background = THEMES[themeId].colors.background;
      return (
        <>
          <style>{`html, body, #storybook-root { background: ${background}; min-height: 100%; }`}</style>
          {/* `ui/Screen` jette sans safe area provider ("No safe area value available"). */}
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
    // Ordre du menu : comme le rangement de src/components (home, game, geo, setup, ui).
    options: {
      storySort: { order: ['Home', 'Game', 'Geo', 'Setup', 'UI'] },
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
