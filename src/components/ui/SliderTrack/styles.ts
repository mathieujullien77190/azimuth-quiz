import { StyleSheet } from 'react-native';
import { fontSize, spacing } from '@/data';
import type { Theme } from '@/types';
import { MARK_LABEL_WIDTH, THUMB_SIZE, TOUCH_HEIGHT, TRACK_HEIGHT } from './constants';

const TRACK_TOP = (TOUCH_HEIGHT - TRACK_HEIGHT) / 2;

export const createStyles = ({ colors, typography }: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
    value: {
      ...typography.display,
      color: colors.accent,
      fontSize: fontSize.title,
      flexShrink: 1,
    },
    caption: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: fontSize.caption + 1,
      textAlign: 'right',
    },
    touchArea: {
      height: TOUCH_HEIGHT,
      justifyContent: 'center',
    },
    track: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: TRACK_TOP,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.surfaceHigh,
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: TRACK_TOP,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: colors.accent,
    },
    dot: {
      position: 'absolute',
      top: TRACK_TOP + TRACK_HEIGHT / 2 - 2,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.background,
      opacity: 0.6,
    },
    thumb: {
      position: 'absolute',
      top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: colors.surface,
      borderWidth: 4,
      borderColor: colors.accent,
    },
    marks: {
      height: 16,
    },
    mark: {
      ...typography.body,
      position: 'absolute',
      width: MARK_LABEL_WIDTH,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: fontSize.caption,
    },
  });
