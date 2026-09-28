import type { Preview } from '@storybook/react-vite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// `ui/Screen`'s `SafeAreaView` throws ("No safe area value available") without a
// `SafeAreaProvider` above it — same reason `admin/src/views/ComponentGalleryView` supplied one
// by hand (see its own doc comment). `useTheme()`/`useTranslation()` need no provider here: their
// contexts (`ThemeSettingsContext`/`LanguageContext`) both ship a default value, unlike
// safe-area-context's.
// The app's own themes are both dark-ish (night/day, see src/themes) — a white canvas behind
// every story clashes with basically all of them, so the preview iframe gets its own fixed
// background instead of Storybook's default white.
const PREVIEW_BACKGROUND = 'rgba(11,18,32,1.00)';

const preview: Preview = {
  decorators: [
    (Story) => (
      <>
        <style>{`html, body, #storybook-root { background: ${PREVIEW_BACKGROUND}; min-height: 100%; }`}</style>
        <SafeAreaProvider
          initialMetrics={{ frame: { x: 0, y: 0, width: 1024, height: 768 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}
        >
          <Story />
        </SafeAreaProvider>
      </>
    ),
  ],
  parameters: {
    // The app's own components first, then each game's, and the two generic families — the setup
    // sections and the UI primitives — at the bottom of the sidebar.
    options: {
      storySort: { order: ['Common', 'Compass', 'Clues', 'Silhouette', 'Setup', 'UI'] },
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
