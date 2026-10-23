import { StyleSheet } from 'react-native';

export const createStyles = (size: number) =>
  StyleSheet.create({
    dial: { width: size, height: size },
    needle: { ...StyleSheet.absoluteFill },
  });
