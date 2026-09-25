import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import ContourSettingsProvider from '@/components/ContourSettingsProvider';
import IndicesSettingsProvider from '@/components/IndicesSettingsProvider';
import LanguageProvider from '@/components/LanguageProvider';
import SettingsProvider from '@/components/SettingsProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { disableTextSelection, polyfillFlagEmoji } from '@/helpers';
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

  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <IndicesSettingsProvider>
            <ContourSettingsProvider>
              <ThemedShell />
            </ContourSettingsProvider>
          </IndicesSettingsProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
