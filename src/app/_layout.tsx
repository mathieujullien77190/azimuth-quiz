import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import LanguageProvider from '@/components/LanguageProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { disableTextSelection, polyfillFlagEmoji } from '@/helpers';
import { hydratePlayerName, hydrateSettings } from '@/settings';
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
  useEffect(hydratePlayerName, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemedShell />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
