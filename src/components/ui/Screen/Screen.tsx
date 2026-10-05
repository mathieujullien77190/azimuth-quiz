import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/themes';

import type { ScreenProps } from './types';

import { createStyles } from './styles';

export const Screen = ({ children, header, footer, overlay, scrollRef, onScroll }: ScreenProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Edge to edge, the keyboard no longer pushes the layout up by itself (Android's `adjustResize` is gone): the
          header, the body and the footer shrink above it instead, so a field being typed in, and the footer's own
          buttons, are never left behind the keyboard. The overlay stays out of it, over everything. */}
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoiding}>
        {header}
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          ref={scrollRef}
          scrollEventThrottle={onScroll ? 32 : undefined}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
      {overlay}
    </SafeAreaView>
  );
};
