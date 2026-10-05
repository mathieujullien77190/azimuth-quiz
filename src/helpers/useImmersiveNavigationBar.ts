import { NavigationBar } from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Hides the Android system navigation bar (◁ ○ □) while a game is on screen: edge to edge, it draws over the bottom of
 * the app, on top of the footer's buttons. A swipe up from the bottom edge brings it back for a moment, and it is shown
 * again for good when the game screen goes away. Android only (nothing to hide on iOS or the web), and cosmetic: a
 * failure is swallowed, the game plays just the same.
 */
export const useImmersiveNavigationBar = (): void => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const setHidden = (hidden: boolean) => {
      try {
        NavigationBar.setHidden(hidden);
      } catch {
        // The bar stays as it is.
      }
    };
    setHidden(true);
    return () => setHidden(false);
  }, []);
};
