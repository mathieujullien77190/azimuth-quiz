import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { fontSize, spacing } from '@/constants';
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

import { MARK_LABEL_WIDTH, THUMB_SIZE, TOUCH_HEIGHT, TRACK_HEIGHT } from './constants';
import { markLeft, ratioFromTouch, thumbCenter } from './helpers';
import type { SliderTrackProps } from './types';

const TRACK_TOP = (TOUCH_HEIGHT - TRACK_HEIGHT) / 2;

const createStyles = ({ colors, typography }: Theme) =>
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

export const SliderTrack = ({ label, valueText, caption, ratio, marks, onRatioChange }: SliderTrackProps) => {
  const styles = useThemedStyles(createStyles);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const onChangeRef = useRef(onRatioChange);
  onChangeRef.current = onRatioChange;

  const panResponder = useMemo(() => {
    const update = (x: number) => onChangeRef.current(ratioFromTouch(x, widthRef.current, THUMB_SIZE));

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => update(event.nativeEvent.locationX),
      onPanResponderMove: (event) => update(event.nativeEvent.locationX),
    });
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  };

  const center = thumbCenter(ratio, width, THUMB_SIZE);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text numberOfLines={1} style={styles.value}>
          {valueText}
        </Text>
      </View>
      {caption !== undefined && <Text style={styles.caption}>{caption}</Text>}

      <View
        accessibilityLabel={label}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: valueText }}
        onLayout={handleLayout}
        style={styles.touchArea}
        {...panResponder.panHandlers}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.track} />
          <View style={[styles.fill, { width: center }]} />
          {marks.map((mark) => (
            <View key={mark.label} style={[styles.dot, { left: thumbCenter(mark.ratio, width, THUMB_SIZE) - 2 }]} />
          ))}
          <View style={[styles.thumb, { left: center - THUMB_SIZE / 2 }]} />
        </View>
      </View>

      <View style={styles.marks}>
        {marks.map((mark) => (
          <Text
            key={mark.label}
            style={[styles.mark, { left: markLeft(mark.ratio, width, THUMB_SIZE, MARK_LABEL_WIDTH) }]}
          >
            {mark.label}
          </Text>
        ))}
      </View>
    </View>
  );
};
