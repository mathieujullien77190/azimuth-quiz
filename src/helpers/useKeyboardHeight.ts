import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/**
 * How tall the on-screen keyboard is right now (0 while it is down). For what is positioned absolutely from the bottom
 * of the screen (Silhouette's floating footer), which a `KeyboardAvoidingView` cannot lift: edge to edge, the keyboard
 * no longer pushes the layout up by itself.
 */
export const useKeyboardHeight = (): number => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', (event) => setHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return height;
};
