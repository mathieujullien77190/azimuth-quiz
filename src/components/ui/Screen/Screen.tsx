import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import ThemeBackdrop from '../../ThemeBackdrop';
import type { ScreenProps } from './types';

const createStyles = ({ colors, isDark }: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      // White by day rather than the page's own light-blue background: it reads as a
      // washed-out extension of the page instead of a distinct fixed bar (see Screen's header
      // in GameScreen/IndicesGameScreen, same fix). Night keeps colors.background, already dark
      // enough to read as its own bar against the starry backdrop.
      backgroundColor: isDark ? colors.background : colors.surface,
    },
  });

const Screen = ({ children, header, footer, scrollRef }: ScreenProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemeBackdrop />
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
};

export default Screen;
