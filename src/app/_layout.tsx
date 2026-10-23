import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import ErrorNoticeHost from '@/components/providers/ErrorNoticeHost';
import LanguageProvider from '@/components/providers/LanguageProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { preloadCounts } from '@/firebase/groupCounts';
import { disableTextSelection, polyfillFlagEmoji } from '@/helpers';
import { writeErrorRecord } from '@/firebase/errorSink';
import { setErrorReporter } from '@/helpers/errors';
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
  // Tailles des groupes (`meta/*Counts`) lues des maintenant : un jeu les trouve deja chargees.
  useEffect(preloadCounts, []);
  // Les ecritures en echec vont dans la collection `errors` (voir `helpers/errors.ts`).
  useEffect(() => {
    setErrorReporter(writeErrorRecord);
    return () => setErrorReporter(null);
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemedShell />
        <ErrorNoticeHost />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
