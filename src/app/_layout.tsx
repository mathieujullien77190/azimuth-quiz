import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import IndicesSettingsProvider from '@/components/IndicesSettingsProvider';
import LanguageProvider from '@/components/LanguageProvider';
import SettingsProvider from '@/components/SettingsProvider';
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
    <LanguageProvider>
      <SettingsProvider>
        <IndicesSettingsProvider>
          <ThemedShell />
        </IndicesSettingsProvider>
      </SettingsProvider>
    </LanguageProvider>
  );
};

export default RootLayout;
