import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import ContourSettingsProvider from '@/games/contour/components/ContourSettingsProvider';
import IndicesSettingsProvider from '@/games/indices/components/IndicesSettingsProvider';
import LanguageProvider from '@/components/LanguageProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { disableTextSelection, polyfillFlagEmoji } from '@/helpers';
import { hydrateSettings } from '@/settings';
import { useTheme } from '@/themes';

const ThemedShell = () => {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      />
    </>
  );
};

const RootLayout = () => {
  useEffect(disableTextSelection, []);
  useEffect(polyfillFlagEmoji, []);
  useEffect(hydrateSettings, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <IndicesSettingsProvider>
          <ContourSettingsProvider>
            <ThemedShell />
          </ContourSettingsProvider>
        </IndicesSettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
