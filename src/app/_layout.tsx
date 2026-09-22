import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import SettingsProvider from '@/components/SettingsProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { disableTextSelection } from '@/helpers';
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

  return (
    <ThemeProvider>
      <SettingsProvider>
        <ThemedShell />
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
