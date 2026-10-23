import { NavigationBar } from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Masque la barre de navigation Android pendant une partie (elle recouvre les boutons du footer) ; un swipe depuis
 * le bas la rend un instant. Android seul, cosmetique : un echec est ignore.
 */
export const useImmersiveNavigationBar = (): void => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const setHidden = (hidden: boolean) => {
      try {
        NavigationBar.setHidden(hidden);
      } catch {
        // La barre reste telle quelle.
      }
    };
    setHidden(true);
    return () => setHidden(false);
  }, []);
};
