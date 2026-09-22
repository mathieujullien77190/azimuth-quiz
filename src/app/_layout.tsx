import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import SettingsProvider from '@/components/SettingsProvider';
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
    <SettingsProvider>
      <ThemedShell />
    </SettingsProvider>
  );
};

export default RootLayout;
