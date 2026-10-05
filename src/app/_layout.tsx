import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import ErrorNoticeHost from '@/components/ErrorNoticeHost';
import LanguageProvider from '@/components/LanguageProvider';
import StartupSplash from '@/components/StartupSplash';
import ThemeProvider from '@/components/ThemeProvider';
import { preloadCluesCounts } from '@/games/clues/helpers/clueCounts';
import { preloadCompassCounts } from '@/games/compass/helpers/compassCounts';
import { disableTextSelection, polyfillFlagEmoji } from '@/helpers';
import { writeErrorRecord } from '@/helpers/errorSink';
import { setErrorReporter } from '@/helpers/reportError';
import { hydrateDevCode, hydratePlayerName, hydrateSettings } from '@/settings';
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
  useEffect(hydrateDevCode, []);
  // Compass group sizes (`meta/compassCounts`): read now so a game finds them already loaded.
  useEffect(preloadCompassCounts, []);
  useEffect(preloadCluesCounts, []);
  // Failed writes are recorded in the `errors` collection (see `helpers/reportError.ts`).
  useEffect(() => {
    setErrorReporter(writeErrorRecord);
    return () => setErrorReporter(null);
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ThemedShell />
        <ErrorNoticeHost />
        <StartupSplash />
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
