import type { Preview } from '@storybook/react-vite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// `ui/Screen`'s `SafeAreaView` throws ("No safe area value available") without a
// `SafeAreaProvider` above it — same reason `admin/src/views/ComponentGalleryView` supplied one
// by hand (see its own doc comment). `useTheme()`/`useTranslation()` need no provider here: their
// contexts (`ThemeSettingsContext`/`LanguageContext`) both ship a default value, unlike
// safe-area-context's.
const preview: Preview = {
  decorators: [
    (Story) => (
      <SafeAreaProvider
        initialMetrics={{ frame: { x: 0, y: 0, width: 1024, height: 768 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}
      >
        <Story />
      </SafeAreaProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
