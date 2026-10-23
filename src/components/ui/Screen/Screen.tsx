import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/themes';

import type { ScreenProps } from './types';

import { createStyles } from './styles';

export const Screen = ({ children, header, footer, overlay, scrollRef, onScroll }: ScreenProps) => {
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Bord a bord, le clavier ne pousse plus la mise en page (`adjustResize` d'Android a disparu) : header, corps et
          footer se reduisent au-dessus de lui, donc un champ en saisie et les boutons du footer ne passent jamais derriere
          le clavier. L'overlay reste hors de ca, par-dessus tout. */}
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
