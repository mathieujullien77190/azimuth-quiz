import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/themes';

import type { ScreenProps } from './types';

import { createStyles } from './styles';

export const Screen = ({ children, header, footer, overlay, scrollRef, onScroll }: ScreenProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
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
      {overlay}
    </SafeAreaView>
  );
};
