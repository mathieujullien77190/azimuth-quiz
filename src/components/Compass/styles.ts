import { StyleSheet } from 'react-native';
import { NORTH_MARKER_HEIGHT } from './constants';

export const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    top: -NORTH_MARKER_HEIGHT - 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
